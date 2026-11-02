import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../context/AuthContext.jsx";

const WS_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:8080/ws-sentinel";

export function useSubscriptionPush(onEvent) {
  const { isAuthenticated } = useAuth();

  // Giữ callback mới nhất mà không làm kết nối bị tạo lại mỗi lần render
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Trình duyệt tự gửi HttpOnly Cookie khi bắt tay WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe("/user/queue/subscription", (message) => {
        if (message.body) handlerRef.current?.(JSON.parse(message.body));
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [isAuthenticated]);
}
