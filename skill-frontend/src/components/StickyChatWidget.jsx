import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { io } from "socket.io-client";
import "@fortawesome/fontawesome-free/css/all.min.css";
import EditButton from "../components/common/EditButton";

export default function StickyChatWidget() {
  const { user, token, profile, chatUnreadCount, setChatUnreadCount } = useAuth();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeContactRef = useRef(null);

  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const loadContacts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getChatContacts(token);
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    }
  }, [token]);

  // Load contacts when widget opens for the first time
  useEffect(() => {
    if (open && contacts.length === 0) {
      setLoadingContacts(true);
      loadContacts().finally(() => setLoadingContacts(false));
    }
  }, [open]);

  // Socket.IO
  useEffect(() => {
    if (!token) return;
    const socket = io("http://localhost:5009", { auth: { token } });
    socketRef.current = socket;

    socket.on("message_deleted", ({ messageId, senderId, receiverId }) => {
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== messageId);
        const otherId = senderId === user.id ? receiverId : senderId;
        setContacts((cs) =>
          cs.map((c) => {
            if (c.id !== otherId) return c;
            const newLast = updated.length > 0 ? updated[updated.length - 1] : null;
            return { ...c, lastMessage: newLast?.content ?? null, lastMessageAt: newLast?.createdAt ?? null, lastMessageSenderId: newLast?.senderId ?? null };
          })
        );
        return updated;
      });
    });

    socket.on("message_updated", (updatedMsg) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => {
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

  // Load messages when contact selected
  useEffect(() => {
    if (!activeContact) return;
    let alive = true;
    setLoadingMessages(true);
    api.getChatMessages(token, activeContact.id).then((data) => {
      if (!alive) return;
      setMessages(Array.isArray(data) ? data : []);
      setLoadingMessages(false);
      api.markChatRead(token, activeContact.id);
      setContacts((prev) => prev.map((c) => (c.id === activeContact.id ? { ...c, unreadCount: 0 } : c)));
      api.getChatUnreadCount(token).then((res) => setChatUnreadCount(res?.unreadCount || 0)).catch(() => {});
      api.updateLastSeen(token).catch(() => {});
    });
    return () => { alive = false; };
  }, [activeContact?.id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadContacts();
      if (token) api.updateLastSeen(token).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [loadContacts, token]);

  useEffect(() => {
    const handler = () => loadContacts();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [loadContacts]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeContact || sending) return;
    setSending(true);
    const outgoing = text.trim();
    const optimistic = { _optimistic: true, senderId: user.id, receiverId: activeContact.id, content: outgoing, isRead: false, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      const saved = await api.sendChatMessage(token, { receiverId: activeContact.id, content: outgoing });
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._optimistic && m.senderId === user.id && m.content === outgoing);
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
        return [...prev, saved];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => !(m._optimistic && m.senderId === user.id && m.content === outgoing)));
      setText(outgoing);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (c) => {
    const name = c.firstName || c.name || "?";
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRelativeTime = (iso) => {
    if (!iso) return "";
    const diffMs = Date.now() - new Date(iso).getTime();
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
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getOnlineStatus = (contact) => {
    if (contact.id === user?.id) return { text: "You", online: true };
    const lastSeen = contact.lastSeen;
    if (lastSeen && new Date(lastSeen).getTime() > Date.now() - 2 * 60 * 1000) return { text: "Online", online: true };
    if (lastSeen) return { text: `Last seen ${getRelativeTime(lastSeen)}`, online: false };
    return { text: "Offline", online: false };
  };

  const getChatDateLabel = (iso) => {
    const date = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const msgDay = new Date(date); msgDay.setHours(0, 0, 0, 0);
    const diff = Math.round((today - msgDay) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getGroupedMessages = (msgs) => {
    const grouped = []; let lastLabel = "";
    msgs.forEach((message) => {
      const label = getChatDateLabel(message.createdAt);
      if (label !== lastLabel) { grouped.push({ type: "label", label }); lastLabel = label; }
      grouped.push({ type: "message", message });
    });
    return grouped;
  };

  const startEdit = (msg) => { if (msg.senderId !== user.id) return; setEditingMsgId(msg.id); setEditText(msg.content); };
  const cancelEdit = () => { setEditingMsgId(null); setEditText(""); };

  const saveEdit = async (msgId) => {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await api.updateChatMessage(token, msgId, editText.trim());
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
      setEditingMsgId(null); setEditText("");
    } catch {
      setEditText(messages.find((m) => m.id === msgId)?.content || "");
    } finally { setSavingEdit(false); }
  };

  const deleteMessage = async (msgId) => {
    setDeletingMsgId(msgId); setConfirmDeleteId(null);
    try {
      await api.deleteChatMessage(token, msgId);
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== msgId);
        if (activeContact) {
          const newLast = updated.length > 0 ? updated[updated.length - 1] : null;
          setContacts((cs) => cs.map((c) => c.id === activeContact.id ? { ...c, lastMessage: newLast?.content ?? null, lastMessageAt: newLast?.createdAt ?? null, lastMessageSenderId: newLast?.senderId ?? null, unreadCount: Math.max((c.unreadCount || 0) - 1, 0) } : c));
        }
        return updated;
      });
    } catch {} finally { setDeletingMsgId(null); }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${c.firstName || c.name || ""} ${c.lastName || ""}`.toLowerCase();
    return name.includes(q) || (c.jobTitle || "").toLowerCase().includes(q);
  });

  const getContactLastMessage = (contact) => {
    if (!contact.lastMessage) return null;
    return { text: contact.lastMessage, isMe: contact.lastMessageSenderId === user.id, time: contact.lastMessageAt };
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {open && <div className="sticky-chat-backdrop" onClick={() => setOpen(false)} />}

      {/* Floating button */}
      <button className="sticky-chat-fab" onClick={() => setOpen((v) => !v)} title="Chat">
        {open ? <i className="fas fa-times" /> : <i className="fas fa-comment-dots" />}
        {!open && chatUnreadCount > 0 && (
          <span className="sticky-chat-fab-badge">{chatUnreadCount}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="sticky-chat-panel">
          {/* Panel header */}
          <div className="sticky-chat-panel-header">
            {activeContact ? (
              <>
                <button className="sticky-chat-back-btn" onClick={() => { setActiveContact(null); setMessages([]); }} title="Back">
                  <i className="fas fa-arrow-left" />
                </button>
                <div className="sticky-chat-header-avatar">
                  {activeContact.avatar
                    ? <img src={activeContact.avatar} alt="" />
                    : getInitials(activeContact)}
                  {getOnlineStatus(activeContact).online && <span className="sticky-online-dot" />}
                </div>
                <div className="sticky-chat-header-info">
                  <div className="sticky-chat-header-name">
                    {activeContact.firstName || activeContact.name}{activeContact.lastName && ` ${activeContact.lastName}`}
                  </div>
                  <div className="sticky-chat-header-status">{getOnlineStatus(activeContact).text}</div>
                </div>
              </>
            ) : (
              <>
                <span className="sticky-chat-panel-title">
                  <i className="fas fa-comment-dots" style={{ marginRight: 8 }} />
                  {user?.role === "admin" ? "Employees" : "Messages"}
                </span>
                {chatUnreadCount > 0 && <span className="sticky-chat-count-badge">{chatUnreadCount}</span>}
              </>
            )}
            <button className="sticky-chat-close-btn" onClick={() => setOpen(false)} title="Close">
              <i className="fas fa-times" />
            </button>
          </div>

          {/* Contact list */}
          {!activeContact && (
            <div className="sticky-chat-contacts">
              <div className="sticky-chat-search-wrap">
                <i className="fas fa-search sticky-chat-search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sticky-chat-search-input"
                />
              </div>
              <div className="sticky-chat-contact-list">
                {loadingContacts && <div className="sticky-chat-loading">Loading...</div>}
                {!loadingContacts && filteredContacts.length === 0 && (
                  <div className="sticky-chat-empty">{searchQuery ? "No results" : "No contacts"}</div>
                )}
                {filteredContacts.map((c) => {
                  const status = getOnlineStatus(c);
                  const lastMsg = getContactLastMessage(c);
                  return (
                    <button key={c.id} className="sticky-chat-contact-item" onClick={() => { setActiveContact(c); setEditingMsgId(null); setEditText(""); }}>
                      <div className="sticky-contact-avatar-wrap">
                        <div className="sticky-contact-avatar">
                          {c.avatar ? <img src={c.avatar} alt="" /> : getInitials(c)}
                        </div>
                        {status.online && <span className="sticky-online-dot" />}
                      </div>
                      <div className="sticky-contact-info">
                        <div className="sticky-contact-name">{c.firstName || c.name}{c.lastName && ` ${c.lastName}`}</div>
                        <div className="sticky-contact-sub">
                          {lastMsg ? (
                            <span className={lastMsg.isMe ? "preview-me" : "preview-them"}>
                              {lastMsg.isMe && "✓ "}{lastMsg.text}
                            </span>
                          ) : (c.jobTitle || c.role)}
                        </div>
                      </div>
                      <div className="sticky-contact-meta">
                        {lastMsg && <span className="sticky-contact-time">{getRelativeTime(lastMsg.time)}</span>}
                        {c.unreadCount > 0 && <span className="chat-unread-badge">{c.unreadCount}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages area */}
          {activeContact && (
            <>
              <div className="sticky-chat-messages">
                {loadingMessages && <div className="sticky-chat-loading">Loading...</div>}
                {!loadingMessages && messages.length === 0 && (
                  <div className="sticky-chat-empty">No messages yet. Say hi! 👋</div>
                )}
                {getGroupedMessages(messages).map((item, idx) => {
                  if (item.type === "label") {
                    return (
                      <div key={`lbl-${idx}`} className="chat-date-separator">
                        <span>{item.label}</span>
                      </div>
                    );
                  }
                  const m = item.message;
                  const isMe = m.senderId === user.id;
                  const isEditing = editingMsgId === m.id;
                  return (
                    <div key={`msg-${idx}`} className={`chat-bubble-wrap ${isMe ? "me" : "them"}`}>
                      <div className={`chat-bubble ${isMe ? "me" : "them"}`}>
                        {isEditing ? (
                          <div className="chat-edit-form">
                            <input value={editText} onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(m.id); } }} autoFocus />
                            <div className="chat-edit-actions">
                              <button type="button" className="chat-edit-cancel" onClick={cancelEdit}>Cancel</button>
                              <button type="button" className="chat-edit-save" onClick={() => saveEdit(m.id)} disabled={savingEdit}>
                                {savingEdit ? "..." : "Save"}
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
                                <EditButton onClick={() => startEdit(m)} />
                                <button type="button" className="chat-action-btn delete" onClick={() => setConfirmDeleteId(m.id)} title="Delete" disabled={deletingMsgId === m.id}>
                                  {deletingMsgId === m.id ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-trash" />}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
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

              <form className="sticky-chat-input-bar" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="sticky-chat-send-btn" disabled={!text.trim() || sending}>
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
