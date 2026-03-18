import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Message({ currentUser, receiverUsername }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const stompClient = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !receiverUsername) return;
    fetchMessages(0);
  }, [currentUser, receiverUsername]);

  const fetchMessages = async (pageNum) => {
    try {
      const res = await axios.get(
        `${API_URL}/messages/${currentUser}/${receiverUsername}`,
        { params: { page: pageNum, size: 20 }, withCredentials: true }
      );
      const fetched = res.data.content;
      if (pageNum === 0) {
        setMessages(fetched);
      } else {
        setMessages((prev) => [...fetched, ...prev]);
      }
      setHasMore(!res.data.last);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const connect = async () => {
        const res = await axios.get(`${API_URL}/me/token`, { withCredentials: true });
        const token = res.data.token;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_URL}/ws`),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/user/queue/messages`, (msg) => {
                    const received = JSON.parse(msg.body);
                    setMessages((prev) => [...prev, received]);
                });
            },
            onDisconnect: () => setConnected(false),
            reconnectDelay: 5000,
        });

        client.activate();
        stompClient.current = client;
    };

    connect();
    return () => stompClient.current?.deactivate();
}, [currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !connected) return;
    stompClient.current.publish({
      destination: "/app/chat",
      body: JSON.stringify({
        receiver: receiverUsername,
        content: input.trim(),
      }),
    });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen bg-lightbackground overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-paddingX py-paddingY bg-white border-b border-lightborder">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold uppercase text-white font-montserrat text-sm">
          {receiverUsername?.[0]}
        </div>
        <div>
          <p className="font-semibold text-primary font-poppins">{receiverUsername}</p>
          <p className="text-vs flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? "bg-success" : "bg-disable"}`} />
            <span className="text-lightgray">{connected ? "Online" : "Connecting..."}</span>
          </p>
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={() => fetchMessages(page + 1)}
            className="text-vs text-accent hover:underline font-poppins"
          >
            Load older messages
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-paddingX py-paddingY space-y-2">
        {messages.map((msg, idx) => {
          const isMine = msg.senderUsername === currentUser;
          return (
            <div key={msg.id ?? idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm font-poppins
                  ${isMine
                    ? "bg-secondary text-white rounded-br-none"
                    : "bg-white text-primary rounded-bl-none border border-lightborder"
                  }`}
              >
                <p>{msg.content}</p>
                <p className={`text-vs mt-1 text-right ${isMine ? "text-white/70" : "text-lightgray"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMine && (
                    <span className="ml-1">{msg.seen ? "✓✓" : "✓"}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-paddingX py-paddingY border-t border-lightborder bg-white">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-full border border-lightborder px-inputX py-inputY text-sm font-poppins text-primary placeholder:text-lightgray focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !input.trim()}
          className="bg-secondary hover:bg-secondary/90 disabled:opacity-40 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 rotate-90" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

    </div>
  );
}