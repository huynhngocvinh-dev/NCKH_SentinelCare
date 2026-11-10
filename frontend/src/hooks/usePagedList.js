import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

/** Danh sách phân trang, chỉ bắt đầu tải khi gọi start() (tải chậm). */
export function usePagedList(fetcher) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const load = useCallback(
    async (target, reset = false) => {
      setLoading(true);
      try {
        const { data } = await fetcher(target);
        setItems((prev) => (reset ? data.content : [...prev, ...data.content]));
        setPage(data.page);
        setHasMore(!data.last);
      } catch (err) {
        toast.error(err.message || "Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  const start = useCallback(() => {
    setStarted(true);
    load(0, true);
  }, [load]);

  const reload = useCallback(() => {
    if (started) load(0, true);
  }, [started, load]);

  return { items, page, hasMore, loading, started, load, start, reload };
}

/** Gọi onEnter đúng một lần khi phần tử cuộn tới gần màn hình. */
export function useInView(ref, onEnter, enabled = true) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onEnter();
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, onEnter, enabled]);
}
