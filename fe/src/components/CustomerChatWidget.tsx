"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: string;
  senderName: string;
  content: string;
  timestamp: string;
};

type ChatConversation = {
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
  conversation?: ChatConversation;
  message?: ChatMessage;
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const STORAGE_KEY = "fiin-home-customer-chat";

const getWebSocketBaseUrl = (baseUrl: string) => baseUrl.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
const normalizeText = (value: string) => value.trim();

export default function CustomerChatWidget() {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { customerName?: string; customerPhone?: string; conversationId?: string };
      if (typeof parsed.customerName === "string") {
        setCustomerName(parsed.customerName);
      }
      if (typeof parsed.customerPhone === "string") {
        setCustomerPhone(parsed.customerPhone);
      }
      if (typeof parsed.conversationId === "string") {
        setConversationId(parsed.conversationId);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!normalizeText(customerName) || !normalizeText(customerPhone)) {
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${getWebSocketBaseUrl(API_BASE)}/ws/chat?role=customer&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}${conversationId ? `&conversationId=${encodeURIComponent(conversationId)}` : ""}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    setIsConnecting(true);
    setError("");

    socket.onopen = () => {
      setIsConnecting(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatSocketEvent;
        if (data.type === "connected" || data.type === "history") {
          const nextConversationId = data.conversation?.conversationId ?? data.conversationId ?? conversationId;
          if (nextConversationId) {
            setConversationId(nextConversationId);
          }
          setMessages(data.conversation?.messages ?? []);
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

    socket.onerror = () => {
      setIsConnecting(false);
      setError("Kết nối chat bị lỗi.");
    };

    socket.onclose = () => {
      setIsConnecting(false);
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    return () => {
      socket.close();
    };
  }, [isOpen, customerName, customerPhone]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!customerName && !customerPhone && !conversationId) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ customerName, customerPhone, conversationId }));
  }, [customerName, customerPhone, conversationId]);

  const startChat = () => {
    const nextName = normalizeText(customerName);
    const nextPhone = normalizeText(customerPhone);
    if (!nextName || !nextPhone) {
      setError("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    setError("");
    setIsOpen(true);

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const sendMessage = () => {
    const content = normalizeText(inputValue);
    if (!content) {
      return;
    }

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ type: "message", content }));
    setInputValue("");
  };

  const hasProfile = Boolean(normalizeText(customerName) && normalizeText(customerPhone));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#8b5e3c] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(122,84,47,0.28)] transition hover:bg-[#734a2d] active:scale-95 sm:hidden"
      >
        <MessageCircle className="h-5 w-5" />
        Chat
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end bg-black/35 p-3 sm:hidden">
          <div className="flex h-[78vh] w-full flex-col overflow-hidden rounded-[28px] border border-[#e2c9ab] bg-[#fffaf2] shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between border-b border-[#eadcc9] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9c7450]">Hỗ trợ trực tiếp</p>
                <h2 className="text-lg font-black text-[#6b4a2d]">Fiin Chat</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-[#f0dfc9] p-2 text-[#7e5331] transition hover:bg-[#e5c5a5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!hasProfile ? (
              <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                <div className="space-y-3">
                  <p className="text-sm text-[#7e5331]">Nhập tên và số điện thoại để bắt đầu chat với nhân viên.</p>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Họ và tên"
                    className="w-full rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                  />
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="Số điện thoại"
                    className="w-full rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                  />
                  {error && <p className="rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b94e3a]">{error}</p>}
                </div>
                <button
                  type="button"
                  onClick={startChat}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#8b5e3c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#734a2d]"
                >
                  Bắt đầu chat
                </button>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-[#eadcc9] px-4 py-3 text-xs text-[#9c7450]">
                  {isConnecting ? "Đang kết nối..." : conversationId ? `Mã chat: ${conversationId}` : "Đã sẵn sàng"}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#e2c9ab] bg-white p-4 text-sm text-[#7e5331]">
                      Xin chào {customerName}, hãy gửi tin nhắn đầu tiên để được hỗ trợ.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderType === "CUSTOMER";
                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isOwnMessage ? "bg-[#8b5e3c] text-white" : "bg-white text-[#6b4a2d] ring-1 ring-[#eadcc9]"}`}>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">{message.senderName}</p>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {error && <div className="border-t border-[#eadcc9] px-4 py-2 text-xs text-[#b94e3a]">{error}</div>}

                <div className="border-t border-[#eadcc9] bg-[#fffaf2] p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={2}
                      placeholder="Nhập tin nhắn..."
                      className="min-h-[48px] flex-1 resize-none rounded-2xl border border-[#e2c9ab] bg-white px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={isConnecting || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5e3c] text-white transition hover:bg-[#734a2d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}