"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send, User } from "lucide-react";

type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: string;
  senderName: string;
  content: string;
  timestamp: string;
};

type ChatConversationSummary = {
  conversationId: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
};

type ChatConversationDetail = {
  conversationId: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
};

type ChatSocketEvent = {
  type: string;
  conversationId?: string;
  conversation?: ChatConversationDetail;
  conversations?: ChatConversationSummary[];
  message?: ChatMessage;
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const getWebSocketBaseUrl = (baseUrl: string) => baseUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");

const formatTime = (value: string) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
};

type AdminChatPanelProps = {
  adminToken?: string;
};

export default function AdminChatPanel({ adminToken }: AdminChatPanelProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [token, setToken] = useState(adminToken ?? "");
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Đang tải danh sách chat...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminToken) {
      setToken(adminToken);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    setToken(window.localStorage.getItem("adminToken") ?? "");
  }, [adminToken]);

  const loadConversations = async () => {
    if (!token) {
      setStatus("Cần đăng nhập admin để xem chat.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setStatus("Phiên đăng nhập admin đã hết hạn. Vui lòng đăng nhập lại để xem chat.");
          setError("");
          setConversations([]);
          setSelectedConversationId("");
          setSelectedConversation(null);
          setMessages([]);
          return;
        }

        throw new Error("Không tải được danh sách chat.");
      }

      const data = (await response.json()) as ChatConversationSummary[];
      setConversations(data);
      setStatus(data.length > 0 ? `Đang mở ${data.length} cuộc trò chuyện.` : "Chưa có cuộc trò chuyện nào.");
    } catch (loadError) {
      setStatus(loadError instanceof Error ? loadError.message : "Không tải được danh sách chat.");
    }
  };

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].conversationId);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    void loadConversations();
    const intervalId = window.setInterval(() => {
      void loadConversations();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [token]);

  const loadConversationDetail = async (conversationId: string) => {
    if (!token || !conversationId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Phiên đăng nhập admin đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }

        throw new Error("Không tải được hội thoại.");
      }

      const data = (await response.json()) as ChatConversationDetail;
      setSelectedConversation(data);
      setMessages(data.messages ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được hội thoại.");
    }
  };

  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    void loadConversationDetail(selectedConversationId);

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const wsUrl = `${getWebSocketBaseUrl(API_BASE)}/ws/chat?role=admin&conversationId=${encodeURIComponent(selectedConversationId)}&token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatSocketEvent;
        if (data.type === "connected" || data.type === "history") {
          if (data.conversation) {
            setSelectedConversation(data.conversation);
            setMessages(data.conversation.messages ?? []);
          }
          return;
        }

        if (data.type === "message" && data.message) {
          setMessages((prev) => [...prev, data.message as ChatMessage]);
        }

        if (data.type === "error" && data.error) {
          setError(data.error);
        }
      } catch {
        setError("Không thể đọc dữ liệu chat.");
      }
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    socket.onerror = () => {
      setError("Kết nối chat bị lỗi.");
    };

    return () => {
      socket.close();
    };
  }, [selectedConversationId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversationId]);

  const sendMessage = () => {
    const content = draft.trim();
    if (!content) {
      return;
    }

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ type: "message", content }));
    setDraft("");
  };

  if (!token) {
    return (
      <section className="rounded-2xl border border-[#e2c9ab] bg-[#fffaf2]/90 p-6 shadow-[0_12px_40px_rgba(122,84,47,0.08)]">
        <h2 className="text-xl font-bold text-[#6b4a2d]">Chat trực tiếp</h2>
        <p className="mt-2 text-sm text-[#9c7450]">Vui lòng đăng nhập admin để xem và phản hồi hội thoại khách hàng.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] shadow-[0_18px_48px_rgba(122,84,47,0.10)]">
      <div className="border-b border-[#eadcc9] bg-[linear-gradient(135deg,#fffaf2_0%,#f5e7d1_100%)] px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5e3c] ring-1 ring-[#e2c9ab]">
              <MessageCircle className="h-3.5 w-3.5" />
              Chat trực tiếp
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#6b4a2d]">Hội thoại khách hàng</h2>
            <p className="mt-1 text-sm text-[#9c7450]">{status}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadConversations()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#e2c9ab] bg-white px-4 py-2.5 text-sm font-semibold text-[#8b5e3c] transition hover:bg-[#f0dfc9]"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-[#eadcc9] bg-[#fffaf2] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 text-sm font-semibold text-[#7e5331]">Danh sách hội thoại</div>
          <div className="space-y-2 overflow-y-auto lg:max-h-[520px]">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e2c9ab] bg-white p-4 text-sm text-[#9c7450]">
                Chưa có hội thoại nào.
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected = conversation.conversationId === selectedConversationId;
                return (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.conversationId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#8b5e3c] bg-[#f6e7d4] shadow-sm"
                        : "border-[#eadcc9] bg-white hover:border-[#8b5e3c]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#6b4a2d]">{conversation.customerName}</p>
                        <p className="text-xs text-[#9c7450]">{conversation.customerPhone}</p>
                      </div>
                      <span className="rounded-full bg-[#f0dfc9] px-2 py-1 text-[11px] font-semibold text-[#7e5331]">
                        {conversation.messageCount}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[#6b4a2d]">{conversation.lastMessage || "Chưa có tin nhắn"}</p>
                    <p className="mt-2 text-[11px] text-[#9c7450]">{formatTime(conversation.lastMessageAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-[#eadcc9] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[#6b4a2d]">{selectedConversation.customerName}</h3>
                    <p className="text-sm text-[#9c7450]">{selectedConversation.customerPhone}</p>
                  </div>
                  <div className="rounded-full bg-[#f0dfc9] px-3 py-1.5 text-xs font-semibold text-[#7e5331]">
                    Mã chat: {selectedConversation.conversationId}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e2c9ab] bg-white p-4 text-sm text-[#9c7450]">
                    Chưa có tin nhắn nào.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdminMessage = message.senderType === "ADMIN";
                    return (
                      <div key={message.id} className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isAdminMessage ? "bg-[#8b5e3c] text-white" : "bg-white text-[#6b4a2d] ring-1 ring-[#eadcc9]"}`}>
                          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">
                            <User className="h-3 w-3" />
                            {message.senderName}
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="mt-1 text-[11px] opacity-70">{formatTime(message.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <div className="border-t border-[#eadcc9] px-5 py-2 text-xs text-[#b94e3a]">{error}</div>}

              <div className="border-t border-[#eadcc9] bg-[#fffaf2] p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Nhập phản hồi..."
                    className="min-h-[48px] flex-1 resize-none rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5e3c] text-white transition hover:bg-[#734a2d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 py-8 text-center text-sm text-[#9c7450]">
              Chọn một cuộc trò chuyện để bắt đầu phản hồi.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}