import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Loader from "../components/Loader";
import { ROUTES } from "../router/routes";

export default function ChatPage() {
  const { user, token, chatUnreadCount, setChatUnreadCount } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoadingContacts(true);
    api.getChatContacts(token).then((data) => {
      if (!alive) return;
      setContacts(Array.isArray(data) ? data : []);
      setLoadingContacts(false);
    }).catch(() => {
      if (!alive) return;
      setContacts([]);
      setLoadingContacts(false);
    });
    return () => { alive = false; };
  }, [token, user?.id]);

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
    });
    return () => { alive = false; };
  }, [activeContact?.id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  if (loadingContacts) return <Loader fullScreen message="Loading chats..." />;

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>{user?.role === "admin" ? "Employees" : "Chats"}</h3>
          <span className="chat-sidebar-count">{contacts.length}</span>
        </div>
        <div className="chat-contact-list">
          {contacts.length === 0 && (
            <div className="chat-empty-sidebar">No contacts available</div>
          )}
          {contacts.map((c) => (
            <button
              key={c.id}
              className={`chat-contact-item${activeContact?.id === c.id ? " active" : ""}`}
              onClick={() => selectContact(c)}
            >
              <div className="chat-contact-avatar">{getInitials(c)}</div>
              <div className="chat-contact-info">
                <div className="chat-contact-name">
                  {c.firstName || c.name}
                  {c.lastName && ` ${c.lastName}`}
                </div>
                <div className="chat-contact-role">{c.jobTitle || c.role}</div>
              </div>
              {c.unreadCount > 0 && (
                <span className="chat-unread-badge">{c.unreadCount}</span>
              )}
            </button>
          ))}
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
              <div className="chat-header-avatar">{getInitials(activeContact)}</div>
              <div>
                <div className="chat-header-name">
                  {activeContact.firstName || activeContact.name}
                  {activeContact.lastName && ` ${activeContact.lastName}`}
                </div>
                <div className="chat-header-role">{activeContact.jobTitle || activeContact.role}</div>
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
                return (
                  <div key={`msg-${idx}`} className={`chat-bubble-wrap ${isMe ? "me" : "them"}`}>
                    <div className={`chat-bubble ${isMe ? "me" : "them"}`}>
                      <div className="chat-bubble-text">{m.content}</div>
                      <div className="chat-bubble-meta">
                        <span>{formatTime(m.createdAt)}</span>
                        {isMe && <span>{m.isRead ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

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
