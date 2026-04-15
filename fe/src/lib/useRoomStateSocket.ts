"use client";

import { useEffect, useRef } from "react";

type RoomStateSocketMessage = {
  type?: string;
  timestamp?: string;
};

const getWebSocketBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return baseUrl.replace(/^http/, "ws").replace(/\/$/, "");
};

export function useRoomStateSocket(onMessage: (message: RoomStateSocketMessage) => void) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const socketUrl = `${getWebSocketBaseUrl()}/ws/room-state`;
    let active = true;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (!active) {
        return;
      }

      try {
        socket = new WebSocket(socketUrl);
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as RoomStateSocketMessage;
            onMessageRef.current(payload);
          } catch {
            onMessageRef.current({ type: "ROOM_STATE_CHANGED" });
          }
        };
        socket.onclose = () => {
          if (active) {
            reconnectTimer = window.setTimeout(connect, 2500);
          }
        };
        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        if (active) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      }
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, []);
}