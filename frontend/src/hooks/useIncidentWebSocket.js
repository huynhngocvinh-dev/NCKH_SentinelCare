import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../context/AuthContext.jsx";

const WS_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:8080/ws-sentinel";

// Một kết nối STOMP dùng chung cho Navbar, IncidentModal... (đếm số nơi đang dùng)
const listeners = new Set();
let client = null;
let users = 0;

function connect() {
  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
  });
  client.onConnect = () => {
    client.subscribe("/user/queue/incidents", (message) => {
      if (!message.body) return;
      let data;
      try {
        data = JSON.parse(message.body);
      } catch {
        return;
      }
      listeners.forEach((fn) => fn(data));
    });
  };
  client.activate();
}

function disconnect() {
  client?.deactivate();
  client = null;
}

export const useIncidentWebSocket = (onMessage) => {
  const { isAuthenticated } = useAuth();

  // Giữ callback mới nhất mà không làm kết nối bị tạo lại mỗi lần render
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const listener = (data) => handlerRef.current?.(data);
    listeners.add(listener);
    if (users++ === 0) connect();
    return () => {
      listeners.delete(listener);
      if (--users === 0) disconnect();
    };
  }, [isAuthenticated]);
};
