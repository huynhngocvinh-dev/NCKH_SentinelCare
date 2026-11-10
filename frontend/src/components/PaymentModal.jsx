import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiInfo,
  FiLoader,
  FiLock,
  FiX,
} from "react-icons/fi";
import { subscriptionApi } from "../services/api";
import {
  ERROR_HINTS,
  PAYMENT_METHODS,
  billingUnit,
  formatDate,
  formatMoney,
  renewalNotice,
} from "../utils/subscriptionFormat";

const DEFAULT_METHOD = "ANY";

// Báo giá do server tính (có quy đổi khi nâng gói)
function useQuote(planId, enabled) {
  const [state, setState] = useState({
    quote: null,
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!enabled || !planId) return;
    let active = true;
    setState({ quote: null, loading: true, error: "" });
    subscriptionApi
      .quote(planId)
      .then(
        ({ data }) =>
          active && setState({ quote: data, loading: false, error: "" })
      )
      .catch(
        (err) =>
          active &&
          setState({ quote: null, loading: false, error: err.message })
      );
    return () => {
      active = false;
    };
  }, [planId, enabled]);

  return state;
}

function Notice({ tone, icon: Icon, children }) {
  const tones = {
    info: "border-blue-100 bg-blue-50 text-blue-900",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <div
      className={`mb-5 flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${tones[tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function QuoteSummary({ quote }) {
  const due = Number(quote.amountDue);
  return (
    <div className="mb-6 space-y-2 rounded-2xl border border-gray-100 p-5 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Giá gói {quote.targetPlanName}</span>
        <span>{formatMoney(quote.listPrice)}</span>
      </div>
      {Number(quote.prorationCredit) > 0 && (
        <div className="flex justify-between text-green-600">
          <span>
            Quy đổi {quote.remainingDays} ngày còn lại của{" "}
            {quote.currentPlanName}
          </span>
          <span>−{formatMoney(quote.prorationCredit)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-slate-900">
        <span>Thanh toán hôm nay</span>
        <span>{formatMoney(due)}</span>
      </div>
    </div>
  );
}

function PaymentMethodPicker({ value, onChange, disabled }) {
  return (
    <>
      <h4 className="mb-3 font-bold text-slate-900">
        Chọn phương thức thanh toán
      </h4>
      <div className="mb-5 space-y-3">
        {PAYMENT_METHODS.map((m) => (
          <label
            key={m.code}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
              value === m.code
                ? "border-blue-500 bg-blue-50/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={m.code}
              checked={value === m.code}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-5 w-5"
            />
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${m.color}`}
            >
              {m.letter}
            </div>
            <div>
              <p className="font-bold text-slate-900">{m.name}</p>
              <p className="text-xs text-gray-500">{m.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </>
  );
}

/**
 * mode="subscribe": đăng ký / nâng / hạ gói (có báo giá từ server)
 * mode="renew":     gia hạn gói hiện tại (plan = gói được tính tiền kỳ tới)
 */
export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  mode = "subscribe",
  onDone,
}) {
  const isRenewal = mode === "renew";
  const fetched = useQuote(plan?.id, isOpen && !isRenewal);

  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(null); // { message, code }

  const quote = useMemo(() => {
    if (!isRenewal || !plan) return fetched.quote;
    return {
      type: "RENEW",
      allowed: true,
      targetPlanName: plan.name,
      listPrice: plan.price,
      prorationCredit: 0,
      amountDue: plan.price,
      recurring: false,
      summary: `Gia hạn gói ${plan.name} cho kỳ tiếp theo.`,
    };
  }, [isRenewal, plan, fetched.quote]);

  useEffect(() => {
    if (!isOpen) return;
    setMethod(DEFAULT_METHOD);
    setError(null);
    setRedirecting(false);
  }, [isOpen, plan]);

  // Đóng bằng phím Esc (trừ khi đang xử lý)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !processing && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, processing, onClose]);

  if (!isOpen || !plan) return null;

  const isDowngrade = quote?.type === "DOWNGRADE";
  const due = Number(quote?.amountDue ?? 0);
  const needsPayment = Boolean(quote?.allowed) && !isDowngrade && due > 0;
  const unit = billingUnit(plan);

  const buttonLabel = redirecting
    ? "Đang chuyển sang VNPAY..."
    : processing
    ? "Đang xử lý..."
    : isDowngrade
    ? "Xác nhận hạ gói"
    : due === 0
    ? "Kích hoạt ngay"
    : isRenewal
    ? `Gia hạn ngay • ${formatMoney(due)}`
    : `Thanh toán • ${formatMoney(due)}`;

  async function handleConfirm() {
    setProcessing(true);
    setError(null);
    let redirected = false;
    try {
      const payload = { payment_method: needsPayment ? method : undefined };
      const { data } = isRenewal
        ? await subscriptionApi.renew(payload)
        : await subscriptionApi.subscribe({ plan_id: plan.id, ...payload });

      // Chuyển sang VNPAY; kết quả sẽ hiện ở trang kết quả thanh toán
      if (data.result === "PENDING_PAYMENT" && data.paymentUrl) {
        redirected = true;
        setRedirecting(true);
        window.location.assign(data.paymentUrl);
        return;
      }
      onDone(data);
    } catch (err) {
      setError({ message: err.message, code: err.code });
    } finally {
      if (!redirected) setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => !processing && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thanh toán gói dịch vụ"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute right-5 top-5 rounded-full bg-gray-100 p-2 text-gray-400 hover:text-gray-700 disabled:opacity-40"
          aria-label="Đóng"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
            {isRenewal
              ? "Gia hạn gói"
              : isDowngrade
              ? "Đổi gói dịch vụ"
              : "Đăng ký gói dịch vụ"}
          </p>
          <h3 className="mb-5 text-2xl font-extrabold text-slate-900">
            {plan.name}
          </h3>

          {fetched.loading && (
            <div className="mb-6 animate-pulse space-y-3">
              <div className="h-5 w-3/4 rounded bg-gray-100" />
              <div className="h-24 rounded-2xl bg-gray-100" />
            </div>
          )}
          {fetched.error && (
            <Notice tone="error" icon={FiAlertTriangle}>
              {fetched.error}
            </Notice>
          )}

          {quote && (
            <>
              <Notice tone="info" icon={FiInfo}>
                {quote.summary}
              </Notice>

              {quote.allowed && !isDowngrade && <QuoteSummary quote={quote} />}

              {isDowngrade && quote.allowed && (
                <Notice tone="info" icon={FiCalendar}>
                  Hiệu lực từ <strong>{formatDate(quote.effectiveAt)}</strong>.
                  Không phát sinh thanh toán hôm nay.
                </Notice>
              )}
              {!quote.allowed && (
                <Notice tone="warn" icon={FiAlertTriangle}>
                  {quote.reason}
                </Notice>
              )}

              {needsPayment && (
                <PaymentMethodPicker
                  value={method}
                  onChange={setMethod}
                  disabled={processing}
                />
              )}

              {needsPayment && quote.recurring && unit && (
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                  {renewalNotice(unit)}
                </p>
              )}
              {needsPayment && !isRenewal && !quote.recurring && (
                <p className="mb-4 text-xs text-gray-500">
                  Gói trọn đời: thanh toán một lần.
                </p>
              )}
            </>
          )}

          {error && (
            <Notice tone="error" icon={FiAlertTriangle}>
              <p className="font-bold">{error.message}</p>
              {ERROR_HINTS[error.code] && (
                <p className="mt-1">{ERROR_HINTS[error.code]}</p>
              )}
            </Notice>
          )}

          <button
            onClick={handleConfirm}
            disabled={processing || fetched.loading || !quote || !quote.allowed}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {processing ? (
              <FiLoader className="h-5 w-5 animate-spin" />
            ) : (
              <FiLock className="h-5 w-5" />
            )}
            {buttonLabel}
          </button>

          {processing && (
            <p className="mt-3 text-center text-xs text-gray-500">
              {redirecting
                ? "Bạn sẽ được chuyển sang trang thanh toán an toàn của VNPAY."
                : "Vui lòng không đóng cửa sổ trong khi hệ thống xử lý."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
