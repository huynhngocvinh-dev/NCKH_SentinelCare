import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const useIncidentWebSocket = (onIncidentReceived) => {
  useEffect(() => {
    // 1. Lấy token để xác nhận đã đăng nhập
    let token = localStorage.getItem("fg_access_token");
    if (!token) {
      try {
        const fgUser = JSON.parse(localStorage.getItem("fg_user") || "{}");
        token = fgUser.token || fgUser.accessToken;
      } catch (e) {
        token = null;
      }
    }

    // Nếu chưa đăng nhập thì không kết nối WebSocket
    if (!token) {
      return;
    }

    // 2. Khởi tạo SockJS kết nối về Backend Spring Boot
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws-sentinel"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // Tự kết nối lại sau 5s nếu rớt mạng
    });

    client.onConnect = () => {
      // 3. Đăng ký lắng nghe kênh thông báo sự cố
      client.subscribe("/topic/incidents", (message) => {
        if (message.body) {
          const incidentData = JSON.parse(message.body);
          if (onIncidentReceived) {
            onIncidentReceived(incidentData);
          }
        }
      });
    };

    client.activate();

    // Cleanup khi component unmount
    return () => {
      client.deactivate();
    };
  }, [onIncidentReceived]);
};
