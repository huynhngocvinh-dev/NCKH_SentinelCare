import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiLoader,
  FiTrash2,
} from "react-icons/fi";
import PaymentModal from "../components/PaymentModal";
import { subscriptionApi } from "../services/api";
import { useSubscription } from "../hooks/useSubscription";
import { useSubscriptionPush } from "../hooks/useSubscriptionPush";
import {
  ACTION_META,
  CANCEL_REASONS,
  INVOICE_STATUS,
  STATUS_META,
  TONE_CLASSES,
  formatDate,
  formatDateTime,
  formatMoney,
} from "../utils/subscriptionFormat";

const fetchInvoices = (page) => subscriptionApi.getInvoices(page, 8);
const fetchHistory = (page) => subscriptionApi.getHistory(page, 8);

// Danh sách phân trang, chỉ bắt đầu tải khi được yêu cầu (tải chậm)
function usePagedList(fetcher) {
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

function useInView(ref, onEnter, enabled) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onEnter();
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, onEnter, enabled]);
}

function Modal({ open, title, children, footer, onClose, busy }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-xl font-extrabold text-slate-900">{title}</h3>
        <div className="mb-6 text-sm leading-relaxed text-gray-600">
          {children}
        </div>
        <div className="flex gap-3">{footer}</div>
      </div>
    </div>
  );
}

export default function SubscriptionManagePage() {
  const { subscription, loading, error, refresh, patch, replace } =
    useSubscription();

  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // 'cancel' | 'removeMethod'
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  // Hóa đơn + nhật ký (tải khi cuộn tới)
  const [panel, setPanel] = useState("invoices");
  const [panelVisible, setPanelVisible] = useState(false);
  const invoices = usePagedList(fetchInvoices);
  const history = usePagedList(fetchHistory);
  const list = panel === "invoices" ? invoices : history;
  const panelRef = useRef(null);

  useInView(panelRef, () => setPanelVisible(true), !loading && !panelVisible);
  useEffect(() => {
    if (panelVisible && !list.started) list.start();
  }, [panelVisible, list.started, list.start]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadLists = useCallback(() => {
    invoices.reload();
    history.reload();
  }, [invoices, history]);

  // Server đẩy sự kiện (gia hạn, thất bại, hết hạn, hủy liên kết...): cập nhật ngay
  useSubscriptionPush(() => {
    refresh();
    reloadLists();
  });

  const progress = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return null;
    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    if (end <= start) return 100;
    return Math.min(
      100,
      Math.max(0, ((Date.now() - start) / (end - start)) * 100)
    );
  }, [subscription]);

  // ---- Hủy gia hạn tự động (phản hồi tức thì, hoàn lại nếu lỗi) ----
  async function handleCancelAutoRenew() {
    const previous = subscription;
    patch({ autoRenew: false, nextBilling: null });
    setBusy(true);
    try {
      const { data } = await subscriptionApi.cancelAutoRenew({
        reason:
          CANCEL_REASONS.find((r) => r.value === cancelReason)?.label ?? null,
        feedback: cancelFeedback.trim() || null,
      });
      replace(data);
      toast.success(
        `Đã hủy gia hạn tự động. Bạn vẫn dùng được gói đến ${formatDate(
          data.currentPeriodEnd
        )}.`
      );
      reloadLists();
    } catch (err) {
      replace(previous);
      toast.error(err.message || "Không thể hủy gia hạn tự động.");
    } finally {
      setBusy(false);
      setDialog(null);
      setCancelReason("");
      setCancelFeedback("");
    }
  }

  // ---- Bật lại gia hạn tự động bằng phương thức đã liên kết ----
  async function handleResume() {
    const previous = subscription;
    patch({ autoRenew: true });
    setBusy(true);
    try {
      const { data } = await subscriptionApi.resumeAutoRenew();
      replace(data);
      toast.success("Đã bật lại tự động gia hạn.");
      reloadLists();
    } catch (err) {
      replace(previous);
      toast.error(err.message || "Không thể bật lại tự động gia hạn.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMethod() {
    setBusy(true);
    try {
      await subscriptionApi.removePaymentMethod(subscription.paymentMethod.id);
      toast.success("Đã xóa phương thức thanh toán.");
      await refresh();
      reloadLists();
    } catch (err) {
      toast.error(err.message || "Không thể xóa phương thức thanh toán.");
    } finally {
      setBusy(false);
      setDialog(null);
    }
  }

  async function handleCancelPending() {
    const previous = subscription;
    patch({ pendingChange: null });
    try {
      await subscriptionApi.cancelPendingChange();
      toast.success("Đã hủy thay đổi gói đang chờ.");
      reloadLists();
    } catch (err) {
      replace(previous);
      toast.error(err.message || "Không thể hủy thay đổi gói.");
    }
  }

  async function handlePaid(result) {
    setPayOpen(false);
    toast.success(result.message);
    await refresh();
    reloadLists();
  }

  // ---------------- Hiển thị ----------------
  if (loading && !subscription) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-12">
        <div className="mx-auto h-8 w-1/3 rounded bg-gray-100" />
        <div className="h-64 rounded-3xl bg-gray-100" />
        <div className="h-24 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 font-bold text-red-500">
          {error || "Không thể tải thông tin gói dịch vụ."}
        </p>
        <button
          onClick={refresh}
          className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const status = STATUS_META[subscription.status] || STATUS_META.ACTIVE;
  const isFree = subscription.status === "FREE";
  const gracePeriod = subscription.status === "GRACE_PERIOD";
  const hasRenewal = !isFree && !subscription.lifetime;
  const method = subscription.paymentMethod;
  const periodEndText = formatDate(subscription.currentPeriodEnd);
  const currentPlan = {
    id: subscription.planId,
    name: subscription.planName,
    durationDays: subscription.durationDays,
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-10">
        <div className="mb-8 flex justify-center gap-8 text-sm font-semibold text-gray-500">
          <Link to="/bang-gia" className="pb-1 hover:text-slate-900">
            Bảng giá
          </Link>
          <span className="border-b-2 border-blue-600 pb-1 text-slate-900">
            Gói của tôi
          </span>
        </div>

        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">
            Tài khoản & Dịch vụ
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Quản lý gói dịch vụ
          </h1>
        </div>

        {/* Ân hạn: thu tiền lỗi nhưng vẫn giữ quyền lợi */}
        {gracePeriod && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <FiAlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm leading-relaxed text-amber-900">
              <p className="font-bold">Thanh toán gia hạn chưa thành công</p>
              <p>
                {subscription.lastPaymentError
                  ? `${subscription.lastPaymentError} `
                  : ""}
                Bạn vẫn giữ nguyên quyền lợi đến hết{" "}
                <strong>{formatDate(subscription.gracePeriodEnd)}</strong>. Hệ
                thống sẽ thử trừ tiền lại mỗi 24 giờ. Hãy nạp tiền vào ví hoặc
                đổi phương thức thanh toán.
              </p>
            </div>
            <button
              onClick={() => setPayOpen(true)}
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
            >
              Thanh toán ngay
            </button>
          </div>
        )}

        {/* Lịch hạ gói */}
        {subscription.pendingChange && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center">
            <FiCalendar className="h-6 w-6 shrink-0 text-blue-600" />
            <div className="flex-1 text-sm leading-relaxed text-blue-900">
              <p className="font-bold">
                Đã lên lịch đổi sang {subscription.pendingChange.planName}
              </p>
              <p>
                Bạn vẫn dùng gói {subscription.planName} đến hết{" "}
                {formatDate(subscription.pendingChange.effectiveAt)}. Từ ngày đó
                gói mới ({formatMoney(subscription.pendingChange.amount)}) bắt
                đầu.
              </p>
            </div>
            <button
              onClick={handleCancelPending}
              className="shrink-0 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              Hủy thay đổi
            </button>
          </div>
        )}

        {/* Gói hiện tại */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                Gói hiện tại
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {subscription.planName}
              </h2>
            </div>
            <span
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${status.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          <div className="mb-6 rounded-2xl bg-gray-50 p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-gray-100 bg-white p-3 text-blue-500 shadow-sm">
                <FiCalendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Thời hạn gói
                </p>
                <p className="font-bold text-slate-900">
                  {isFree
                    ? "Không giới hạn thời gian"
                    : subscription.lifetime
                    ? "Trọn đời"
                    : `Đến ${periodEndText} (còn ${subscription.daysRemaining} ngày)`}
                </p>
              </div>
            </div>
            {progress !== null && (
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200"
                aria-label="Tiến độ chu kỳ"
              >
                <div
                  className={`h-full rounded-full ${
                    gracePeriod ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {subscription.features.length > 0 && (
            <>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                Quyền lợi đang sử dụng
              </p>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {subscription.features.map((f) => (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-500">
                      <FiCheck className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Link
            to="/bang-gia"
            className="block w-full rounded-xl border-2 border-blue-100 py-3.5 text-center font-bold text-blue-600 transition hover:bg-blue-50"
          >
            {isFree ? "Xem các gói trả phí" : "Thay đổi gói"}
          </Link>
        </div>

        {/* Phương thức thanh toán + tự động gia hạn */}
        {hasRenewal && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <FiCreditCard className="h-4 w-4 text-blue-500" /> Thanh toán &
              gia hạn tự động
            </h4>

            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Phương thức thanh toán
                </p>
                <p className="truncate font-bold text-slate-900">
                  {method
                    ? method.displayName
                    : "Chưa liên kết phương thức nào"}
                </p>
              </div>
              {method && (
                <button
                  onClick={() => setDialog("removeMethod")}
                  disabled={busy}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Xóa phương thức thanh toán"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {subscription.autoRenew && subscription.nextBilling ? (
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                Ngày{" "}
                <strong className="text-slate-800">
                  {formatDate(subscription.nextBilling.date)}
                </strong>{" "}
                hệ thống sẽ tự động trừ{" "}
                <strong className="text-slate-800">
                  {formatMoney(subscription.nextBilling.amount)}
                </strong>{" "}
                cho gói {subscription.nextBilling.planName}. Email nhắc sẽ gửi
                trước 3 ngày.
              </p>
            ) : (
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                {gracePeriod
                  ? "Gói đang quá hạn thanh toán, hệ thống đang thử trừ tiền lại."
                  : `Tự động gia hạn đang tắt. Gói dùng được đến ${periodEndText}, sau đó chuyển về gói Miễn phí.`}
              </p>
            )}

            {!gracePeriod &&
              (subscription.autoRenew ? (
                <button
                  onClick={() => setDialog("cancel")}
                  disabled={busy}
                  className="text-sm font-bold text-red-500 underline hover:text-red-600"
                >
                  Hủy gia hạn tự động
                </button>
              ) : method ? (
                <button
                  onClick={handleResume}
                  disabled={busy}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Bật lại tự động gia hạn
                </button>
              ) : (
                <p className="text-xs text-gray-500">
                  Muốn tiếp tục sau ngày {periodEndText}? Hãy đăng ký lại gói ở
                  mục Bảng giá để liên kết phương thức thanh toán.
                </p>
              ))}
          </div>
        )}

        {/* Hóa đơn + lịch sử thay đổi */}
        <div
          ref={panelRef}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex gap-2">
            <button
              onClick={() => setPanel("invoices")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                panel === "invoices"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <FiFileText className="h-4 w-4" /> Hóa đơn
            </button>
            <button
              onClick={() => setPanel("history")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
                panel === "history"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <FiClock className="h-4 w-4" /> Lịch sử thay đổi
            </button>
          </div>

          {!list.started || (list.loading && list.items.length === 0) ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : list.items.length === 0 ? (
            <p className="text-sm text-gray-400">
              {panel === "invoices"
                ? "Chưa có hóa đơn nào."
                : "Chưa có thay đổi nào."}
            </p>
          ) : panel === "invoices" ? (
            <ul className="divide-y divide-gray-100">
              {list.items.map((inv) => {
                const s = INVOICE_STATUS[inv.status] || INVOICE_STATUS.PENDING;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {inv.number} • {inv.planName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTime(inv.createdAt)}
                        {inv.paymentMethodLabel
                          ? ` • ${inv.paymentMethodLabel}`
                          : ""}
                      </p>
                      {inv.status === "FAILED" && inv.failureMessage && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {inv.failureMessage}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatMoney(inv.amount)}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ol className="relative ml-2 space-y-5 border-l border-gray-200">
              {list.items.map((log) => {
                const meta = ACTION_META[log.action] || {
                  label: log.action,
                  tone: "neutral",
                };
                return (
                  <li key={log.id} className="ml-5">
                    <span
                      className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ${
                        TONE_CLASSES[meta.tone]
                      }`}
                    />
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">
                        {meta.label}
                        {log.amount != null && Number(log.amount) > 0 && (
                          <span className="font-medium text-gray-500">
                            {" "}
                            • {formatMoney(log.amount)}
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    {log.message && (
                      <p className="mt-0.5 text-sm text-gray-500">
                        {log.message}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {log.actor === "SYSTEM"
                        ? "Hệ thống tự động"
                        : "Bạn thực hiện"}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          {list.hasMore && (
            <button
              onClick={() => list.load(list.page + 1)}
              disabled={list.loading}
              className="mt-6 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {list.loading ? "Đang tải..." : "Xem thêm"}
            </button>
          )}
        </div>
      </div>

      {/* Pop-up hủy gia hạn: hỏi lý do + cảnh báo quyền lợi còn lại */}
      <Modal
        open={dialog === "cancel"}
        title="Hủy gia hạn tự động?"
        busy={busy}
        onClose={() => setDialog(null)}
        footer={
          <>
            <button
              onClick={() => setDialog(null)}
              disabled={busy}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
            >
              Giữ gia hạn
            </button>
            <button
              onClick={handleCancelAutoRenew}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy && <FiLoader className="h-4 w-4 animate-spin" />} Xác nhận
              hủy
            </button>
          </>
        }
      >
        <p className="mb-4 rounded-xl bg-blue-50 p-3 text-blue-900">
          Bạn vẫn có thể sử dụng quyền lợi của gói cho đến ngày{" "}
          <strong>{periodEndText}</strong>.
        </p>
        <p className="mb-2 font-bold text-slate-800">
          Vì sao bạn muốn hủy? (không bắt buộc)
        </p>
        <div className="mb-3 space-y-1.5">
          {CANCEL_REASONS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="cancelReason"
                value={r.value}
                checked={cancelReason === r.value}
                onChange={() => setCancelReason(r.value)}
              />
              {r.label}
            </label>
          ))}
        </div>
        <textarea
          value={cancelFeedback}
          onChange={(e) => setCancelFeedback(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Góp ý thêm để chúng tôi cải thiện dịch vụ..."
          className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
        />
      </Modal>

      <Modal
        open={dialog === "removeMethod"}
        title="Xóa phương thức thanh toán?"
        busy={busy}
        onClose={() => setDialog(null)}
        footer={
          <>
            <button
              onClick={() => setDialog(null)}
              disabled={busy}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleRemoveMethod}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy && <FiLoader className="h-4 w-4 animate-spin" />} Xóa
            </button>
          </>
        }
      >
        Gói sẽ <strong>không tự động gia hạn</strong> nữa và liên kết với{" "}
        {method?.displayName} bị thu hồi. Bạn vẫn dùng được gói đến{" "}
        {periodEndText}.
      </Modal>

      <PaymentModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        plan={currentPlan}
        onDone={handlePaid}
      />
    </div>
  );
}
