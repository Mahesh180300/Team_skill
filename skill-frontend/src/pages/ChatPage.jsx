import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Loader from "../components/Loader";
import { ROUTES } from "../router/routes";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { io } from "socket.io-client";

export default function ChatPage() {
  const { user, token, profile, chatUnreadCount, setChatUnreadCount } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const socketRef = useRef(null);
  const activeContactRef = useRef(null);

  // keep ref in sync with state
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const loadContacts = useCallback(async () => {
    try {
      const data = await api.getChatContacts(token);
      const list = Array.isArray(data) ? data : [];
      setContacts(list);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [token]);

  useEffect(() => {
    setLoadingContacts(true);
    loadContacts();
  }, [loadContacts]);

  // Socket.IO connection
  useEffect(() => {
    if (!token) return;
    const socket = io("http://localhost:5009", { auth: { token } });
    socketRef.current = socket;

    socket.on("message_deleted", ({ messageId, senderId, receiverId }) => {
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== messageId);
        // update sidebar last message
        const otherId = senderId === user.id ? receiverId : senderId;
        setContacts((contacts) =>
          contacts.map((c) => {
            if (c.id !== otherId) return c;
            const newLast = updated.length > 0 ? updated[updated.length - 1] : null;
            return {
              ...c,
              lastMessage: newLast?.content ?? null,
              lastMessageAt: newLast?.createdAt ?? null,
              lastMessageSenderId: newLast?.senderId ?? null,
            };
          })
        );
        return updated;
      });
    });

    socket.on("message_updated", (updatedMsg) => {
      setMessages((prev) => prev.map((m) => m.id === updatedMsg.id ? updatedMsg : m));
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => {
        // only add if this conversation is open
        const activeId = activeContactRef.current?.id;
        if (activeId && (msg.senderId === activeId || msg.receiverId === activeId)) {
          return [...prev, msg];
        }
        return prev;
      });
      loadContacts();
    });

    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (!activeContact) return;
    let alive = true;
    setLoadingMessages(true);
    api.getChatMessages(token, activeContact.id).then((data) => {
      if (!alive) return;
      setMessages(Array.isArray(data) ? data : []);
      setLoadingMessages(false);
      api.markChatRead(token, activeContact.id);
      setContacts((prev) =>
        prev.map((c) => (c.id === activeContact.id ? { ...c, unreadCount: 0 } : c))
      );
      api.getChatUnreadCount(token).then((res) => setChatUnreadCount(res?.unreadCount || 0)).catch(() => {});
      api.updateLastSeen(token).catch(() => {});
    });
    return () => { alive = false; };
  }, [activeContact?.id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadContacts();
      if (token) api.updateLastSeen(token).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [loadContacts, token]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadContacts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadContacts]);

  useEffect(() => {
    const handler = () => loadContacts();
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [loadContacts]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeContact || sending) return;
    setSending(true);
    const outgoing = text.trim();
    const optimistic = {
      _optimistic: true,
      senderId: user.id,
      receiverId: activeContact.id,
      content: outgoing,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      const saved = await api.sendChatMessage(token, { receiverId: activeContact.id, content: outgoing });
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._optimistic && m.senderId === user.id && m.content === outgoing);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => !(m._optimistic && m.senderId === user.id && m.content === outgoing)));
      setText(outgoing);
    } finally {
      setSending(false);
    }
  };

  const selectContact = (contact) => {
    setActiveContact(contact);
    setEditingMsgId(null);
    setEditText("");
  };

  const getInitials = (c) => {
    const name = c.firstName || c.name || "?";
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRelativeTime = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getChatDateLabel = (iso) => {
    const date = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const messageDay = new Date(date);
    messageDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today - messageDay) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getGroupedMessages = (msgs) => {
    const grouped = [];
    let lastLabel = "";

    msgs.forEach((message) => {
      const label = getChatDateLabel(message.createdAt);
      if (label !== lastLabel) {
        grouped.push({ type: "label", label });
        lastLabel = label;
      }
      grouped.push({ type: "message", message });
    });

    return grouped;
  };

  const getOnlineStatus = (contact) => {
    if (contact.id === user?.id) return { text: "You", online: true };
    const lastSeen = contact.lastSeen;
    if (lastSeen && new Date(lastSeen).getTime() > Date.now() - 2 * 60 * 1000) {
      return { text: "Online", online: true };
    }
    if (lastSeen) {
      return { text: `Last seen ${getRelativeTime(lastSeen)}`, online: false };
    }
    return { text: "Offline", online: false };
  };

  const startEdit = (msg) => {
    if (msg.senderId !== user.id) return;
    setEditingMsgId(msg.id);
    setEditText(msg.content);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText("");
  };

  const saveEdit = async (msgId) => {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateChatMessage(token, msgId, editText.trim());
      setMessages((prev) => prev.map((m) => m.id === msgId ? updated : m));
      setEditingMsgId(null);
      setEditText("");
    } catch {
      setEditText(messages.find((m) => m.id === msgId)?.content || "");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = async (msgId) => {
    setDeletingMsgId(msgId);
    setConfirmDeleteId(null);
    try {
      await api.deleteChatMessage(token, msgId);
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== msgId);
        // update sidebar last message immediately
        if (activeContact) {
          const newLast = updated.length > 0 ? updated[updated.length - 1] : null;
          setContacts((contacts) =>
            contacts.map((c) =>
              c.id === activeContact.id
                ? {
                    ...c,
                    lastMessage: newLast?.content ?? null,
                    lastMessageAt: newLast?.createdAt ?? null,
                    lastMessageSenderId: newLast?.senderId ?? null,
                    unreadCount: Math.max((c.unreadCount || 0) - 1, 0),
                  }
                : c
            )
          );
        }
        return updated;
      });
    } catch {
      // ignore
    } finally {
      setDeletingMsgId(null);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${c.firstName || c.name || ""} ${c.lastName || ""}`.toLowerCase();
    return name.includes(q) || (c.jobTitle || "").toLowerCase().includes(q);
  });

  const getContactLastMessage = (contact) => {
    if (!contact.lastMessage) return null;
    const isMe = contact.lastMessageSenderId === user.id;
    return { text: contact.lastMessage, isMe, time: contact.lastMessageAt };
  };

  if (loadingContacts) return <Loader fullScreen message="Loading chats..." />;

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>{user?.role === "admin" ? "Employees" : "Chats"}</h3>
          <span className="chat-sidebar-count">{contacts.length}</span>
        </div>
        <div className="chat-search-wrap">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
        </div>
        <div className="chat-contact-list">
          {filteredContacts.length === 0 && (
            <div className="chat-empty-sidebar">
              {searchQuery ? "No contacts match your search" : "No contacts available"}
            </div>
          )}
          {filteredContacts.map((c) => {
            const status = getOnlineStatus(c);
            const lastMsg = getContactLastMessage(c);
            return (
              <button
                key={c.id}
                className={`chat-contact-item${activeContact?.id === c.id ? " active" : ""}`}
                onClick={() => selectContact(c)}
              >
                <div className="chat-contact-avatar-wrap">
                  <div className="chat-contact-avatar">
                    {c.avatar
                      ? <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : getInitials(c)
                    }
                  </div>
                  {status.online && <span className="chat-online-dot" />}
                </div>
                <div className="chat-contact-info">
                  <div className="chat-contact-name">
                    {c.firstName || c.name}
                    {c.lastName && ` ${c.lastName}`}
                  </div>
                  <div className="chat-contact-role">{c.jobTitle || c.role}</div>
                  {lastMsg && (
                    <div className={`chat-contact-preview ${lastMsg.isMe ? "preview-me" : "preview-them"}`}>
                      {lastMsg.isMe && <span className="preview-me-dot">✓</span>}
                      <span className="preview-text">{lastMsg.text}</span>
                    </div>
                  )}
                </div>
                <div className="chat-contact-meta">
                  {lastMsg && <span className="chat-contact-time">{getRelativeTime(lastMsg.time)}</span>}
                  {c.unreadCount > 0 && (
                    <span className="chat-unread-badge">{c.unreadCount}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="chat-main">
        {!activeContact ? (
          <div className="chat-no-conversation">
            <div className="chat-no-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a contact from the left to start messaging</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-avatar-wrap">
                <div className="chat-header-avatar">
                  {activeContact.avatar
                    ? <img src={activeContact.avatar} alt={activeContact.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : getInitials(activeContact)
                  }
                </div>
                {getOnlineStatus(activeContact).online && <span className="chat-online-dot chat-online-dot-header" />}
              </div>
              <div>
                <div className="chat-header-name">
                  {activeContact.firstName || activeContact.name}
                  {activeContact.lastName && ` ${activeContact.lastName}`}
                </div>
                <div className="chat-header-role">{getOnlineStatus(activeContact).text}</div>
              </div>
            </div>

            <div className="chat-messages">
              {loadingMessages && <div className="chat-loading-messages">Loading messages...</div>}
              {!loadingMessages && messages.length === 0 && (
                <div className="chat-empty-messages">No messages yet. Start the conversation!</div>
              )}
              {getGroupedMessages(messages).map((item, idx) => {
                if (item.type === "label") {
                  return (
                    <div key={`label-${idx}`} className="chat-date-separator">
                      <span>{item.label}</span>
                    </div>
                  );
                }

                const m = item.message;
                const isMe = m.senderId === user.id;
                const isEditing = editingMsgId === m.id;
                const senderAvatar = isMe ? profile?.avatar : activeContact?.avatar;
                const senderInitials = isMe ? getInitials({ firstName: user.name }) : getInitials(activeContact);
                return (
                  <div key={`msg-${idx}`} className={`chat-bubble-wrap ${isMe ? "me" : "them"}`}>
                    {/* {!isMe && (
                      <div className="chat-msg-avatar">
                        {senderAvatar
                          ? <img src={senderAvatar} alt="avatar" />
                          : <span>{senderInitials}</span>}
                      </div>
                    )} */}
                    <div className={`chat-bubble ${isMe ? "me" : "them"}`}>
                      {isEditing ? (
                        <div className="chat-edit-form">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(m.id); } }}
                            autoFocus
                          />
                          <div className="chat-edit-actions">
                            <button type="button" className="chat-edit-cancel" onClick={cancelEdit}>Cancel</button>
                            <button type="button" className="chat-edit-save" onClick={() => saveEdit(m.id)} disabled={savingEdit}>
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="chat-bubble-text">{m.content}</div>
                          <div className="chat-bubble-meta">
                            <span>{formatTime(m.createdAt)}</span>
                            {isMe && <span className={`chat-read-status ${m.isRead ? "read" : "sent"}`}>{m.isRead ? "✓✓" : "✓"}</span>}
                          </div>
                          {isMe && (
                            <div className="chat-bubble-actions">
                              <button type="button" className="chat-action-btn" onClick={() => startEdit(m)} title="Edit">
                                <i className="fas fa-pencil-alt" />
                              </button>
                              <button type="button" className="chat-action-btn delete" onClick={() => setConfirmDeleteId(m.id)} title="Delete" disabled={deletingMsgId === m.id}>
                                {deletingMsgId === m.id ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash" />}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {/* {isMe && (
                      <div className="chat-msg-avatar">
                        {senderAvatar
                          ? <img src={senderAvatar} alt="avatar" />
                          : <span>{senderInitials}</span>}
                      </div>
                    )} */}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {confirmDeleteId && (
              <div className="chat-delete-overlay" onClick={() => setConfirmDeleteId(null)}>
                <div className="chat-delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="chat-delete-modal-icon"><i className="fas fa-trash" /></div>
                  <h4>Delete Message</h4>
                  <p>This message will be permanently deleted.</p>
                  <div className="chat-delete-modal-actions">
                    <button className="chat-delete-cancel-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                    <button className="chat-delete-confirm-btn" onClick={() => deleteMessage(confirmDeleteId)}>Delete</button>
                  </div>
                </div>
              </div>
            )}

            <form className="chat-input-bar" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="chat-send-btn" disabled={!text.trim() || sending}>
                {sending ? "..." : "Send"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
