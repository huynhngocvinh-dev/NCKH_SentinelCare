import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "fg_access_token";
const USER_KEY = "fg_user";
const LAST_ACTIVITY_KEY = "fg_last_activity";
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 phút (tính bằng mili giây)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [initializing, setInitializing] = useState(true);

  // Cập nhật mốc thời gian hoạt động cuối cùng
  const updateLastActivity = useCallback(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }, []);

  const persistSession = useCallback(
    (nextToken, nextUser) => {
      if (nextToken) {
        localStorage.setItem(TOKEN_KEY, nextToken);
        setToken(nextToken);
      }
      if (nextUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      }
      updateLastActivity();
    },
    [updateLastActivity]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // 1. Kiểm tra session trên LocalStorage khi F5 (Không auto-logout nếu API me() bị lỗi mạng)
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (!token) {
        setInitializing(false);
        return;
      }

      // Kiểm tra xem đã hết 30 phút không hoạt động từ lần cuối chưa
      const lastActivity = parseInt(
        localStorage.getItem(LAST_ACTIVITY_KEY) || "0",
        10
      );
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
        setInitializing(false);
        return;
      }

      // Thử xác thực với Backend (Nếu backend chưa có endpoint /me thì giữ nguyên session cũ)
      try {
        if (authApi?.me) {
          const { data } = await authApi.me();
          if (!cancelled && data?.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
        }
      } catch (err) {
        // Chỉ logout khi server phản hồi chính xác mã 401 Unauthorized
        if (!cancelled && err.response?.status === 401) {
          logout();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Theo dõi thao tác người dùng: Tự động Đăng xuất sau 30 phút treo máy
  useEffect(() => {
    if (!token) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const handleUserActivity = () => {
      const lastActivity = parseInt(
        localStorage.getItem(LAST_ACTIVITY_KEY) || "0",
        10
      );
      const now = Date.now();

      if (lastActivity && now - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      } else {
        updateLastActivity();
      }
    };

    // Gắn sự kiện lắng nghe người dùng tương tác
    events.forEach((event) =>
      window.addEventListener(event, handleUserActivity)
    );

    // Vòng lặp kiểm tra định kỳ mỗi 1 phút
    const interval = setInterval(() => {
      const lastActivity = parseInt(
        localStorage.getItem(LAST_ACTIVITY_KEY) || "0",
        10
      );
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleUserActivity)
      );
      clearInterval(interval);
    };
  }, [token, logout, updateLastActivity]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    initializing,
    login: (nextToken, nextUser) => persistSession(nextToken, nextUser),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
