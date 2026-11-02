import { useCallback, useEffect, useRef, useState } from "react";
import { subscriptionApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Cache theo từng tài khoản: hiện ngay dữ liệu lần trước, cập nhật ngầm phía sau
let cache = { userId: null, data: null };

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;
  const cached = cache.userId === userId ? cache.data : null;

  const [subscription, setSubscription] = useState(cached);
  const [loading, setLoading] = useState(isAuthenticated && !cached);
  const [error, setError] = useState("");
  const alive = useRef(true);

  // Ghi dữ liệu mới từ server vào state + cache
  const replace = useCallback(
    (data) => {
      cache = { userId, data };
      if (alive.current) setSubscription(data);
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    try {
      const { data } = await subscriptionApi.getMy();
      replace(data);
      if (alive.current) setError("");
      return data;
    } catch (err) {
      if (alive.current) {
        setError(err.message || "Không thể tải thông tin gói dịch vụ.");
      }
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [replace]);

  useEffect(() => {
    alive.current = true;
    if (isAuthenticated) {
      refresh();
    } else {
      cache = { userId: null, data: null };
      setSubscription(null);
      setLoading(false);
    }
    return () => {
      alive.current = false;
    };
  }, [isAuthenticated, refresh]);

  // Cập nhật lạc quan: đổi giao diện ngay, server xác nhận sau
  const patch = useCallback(
    (partial) => {
      setSubscription((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...partial };
        cache = { userId, data: next };
        return next;
      });
    },
    [userId]
  );

  return { subscription, loading, error, refresh, patch, replace };
}
