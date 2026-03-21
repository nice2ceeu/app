import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Inbox({ currentUser, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchInbox();
  }, [currentUser]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`${API_URL}/inbox`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to fetch inbox", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSelect = (convo) => {
    setSelected(convo.username);
    onSelectConversation(convo.username);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-screen w-80 bg-white border-r border-lightborder">

      {/* Header */}
      <div className="px-paddingX py-paddingY border-b border-lightborder">
        <h1 className="text-lg font-bold text-primary font-montserrat tracking-tight">Messages</h1>
        <p className="text-vs text-lightgray mt-0.5">{conversations.length} conversations</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-paddingX">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton skeleton-avatar skeleton-delay-1" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton skeleton-text skeleton-w-half skeleton-delay-2" />
                  <div className="skeleton skeleton-text-sm skeleton-w-three-quarter skeleton-delay-3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-paddingX">
            <div className="w-14 h-14 rounded-full bg-lightbackground flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-lightgray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-lightgray font-poppins">No conversations yet</p>
            <p className="text-vs text-lightgray/70 mt-1">Start a new message to get going</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const isSelected = selected === convo.username;
            const hasUnread = convo.unreadCount > 0;

            return (
              <button
                key={convo.username}
                onClick={() => handleSelect(convo)}
                className={`w-full flex items-center gap-3 px-paddingX py-paddingY text-left transition-colors
                  ${isSelected ? "bg-lightbackground border-l-2 border-secondary" : "hover:bg-lightbackground/60"}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm uppercase font-montserrat
                    ${isSelected ? "bg-secondary" : "bg-primary"}`}>
                    {convo.username?.[0]}
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate font-poppins
                      ${hasUnread ? "font-semibold text-primary" : "font-medium text-lightgray"}`}>
                      {convo.username}
                    </p>
                    <p className="text-vs text-lightgray ml-2 shrink-0">
                      {formatTime(convo.lastMessageTime)}
                    </p>
                  </div>
                  <p className={`text-vs truncate mt-0.5 font-poppins
                    ${hasUnread ? "text-primary font-medium" : "text-lightgray"}`}>
                    {convo.lastMessage || "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}