import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 phút
const LEGACY_KEYS = ["fg_access_token", "fg_user", "fg_last_activity"];

export function AuthProvider({ children }) {
  // Chỉ giữ thông tin hiển thị của user trong bộ nhớ. Token nằm trong HttpOnly Cookie.
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const lastActivityRef = useRef(Date.now());

  const login = useCallback((nextUser) => {
    lastActivityRef.current = Date.now();
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // Server xóa cookie phiên
    } catch {
      // Cookie đã hết hạn hoặc mạng lỗi: vẫn đăng xuất ở giao diện
    }
    setUser(null);
  }, []);

  // 1. Khi tải trang / F5: hỏi server xem cookie còn hợp lệ không
  useEffect(() => {
    let cancelled = false;

    // Dọn token cũ còn lưu ở localStorage từ phiên bản trước
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

    async function checkSession() {
      try {
        const { data } = await authApi.me();
        if (!cancelled) {
          lastActivityRef.current = Date.now();
          setUser(data);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Bất kỳ API nào trả 401 (cookie hết hạn) -> đăng xuất giao diện
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  // 3. Tự đăng xuất sau 30 phút không thao tác
  useEffect(() => {
    if (!user) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    events.forEach((e) => window.addEventListener(e, markActive));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      clearInterval(interval);
    };
  }, [user, logout]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    initializing,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
