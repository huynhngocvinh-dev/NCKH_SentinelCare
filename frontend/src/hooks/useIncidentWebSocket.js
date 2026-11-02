import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../context/AuthContext.jsx";

const WS_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:8080/ws-sentinel";

export const useIncidentWebSocket = (onIncidentReceived) => {
  const { isAuthenticated } = useAuth();

  // Giữ callback mới nhất mà không làm kết nối bị tạo lại mỗi lần render
  const handlerRef = useRef(onIncidentReceived);
  useEffect(() => {
    handlerRef.current = onIncidentReceived;
  }, [onIncidentReceived]);

  useEffect(() => {
    // Chưa đăng nhập thì không kết nối
    if (!isAuthenticated) return;

    // Trình duyệt tự gửi HttpOnly Cookie khi bắt tay WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      // Kênh riêng của tài khoản đang đăng nhập
      client.subscribe("/user/queue/incidents", (message) => {
        if (message.body) {
          handlerRef.current?.(JSON.parse(message.body));
        }
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [isAuthenticated]);
};
