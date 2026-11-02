import { useEffect, useState } from "react";
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
  consentText,
  formatDate,
  formatMoney,
} from "../utils/subscriptionFormat";

const CARD_LIMIT = 10000000; // giới hạn mỗi giao dịch thẻ qua MoMo

export default function PaymentModal({ isOpen, onClose, plan, onDone }) {
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [method, setMethod] = useState("MOMO_WALLET");
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(null); // { message, code }

  // Mỗi lần mở: lấy báo giá từ server
  useEffect(() => {
    if (!isOpen || !plan) return;
    let active = true;
    setQuote(null);
    setQuoteError("");
    setError(null);
    setRedirecting(false);
    setMethod("MOMO_WALLET");
    setLoadingQuote(true);

    subscriptionApi
      .quote(plan.id)
      .then(({ data }) => active && setQuote(data))
      .catch((err) => active && setQuoteError(err.message))
      .finally(() => active && setLoadingQuote(false));

    return () => {
      active = false;
    };
  }, [isOpen, plan]);

  // Đóng bằng phím Esc (trừ khi đang xử lý)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !processing) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, processing, onClose]);

  if (!isOpen || !plan) return null;

  const isDowngrade = quote?.type === "DOWNGRADE";
  const due = Number(quote?.amountDue ?? 0);
  const canPay = Boolean(quote?.allowed) && !isDowngrade;
  const needsMethod = canPay && due > 0; // phần quy đổi đủ trả giá gói mới thì không cần thanh toán thêm
  const overCardLimit =
    needsMethod && method === "MOMO_CARD" && due > CARD_LIMIT;
  const unit = billingUnit(plan);
  const showConsent = canPay && quote?.recurring && unit;

  const buttonText = redirecting
    ? "Đang chuyển sang MoMo..."
    : processing
    ? "Đang xử lý..."
    : isDowngrade
    ? "Xác nhận hạ gói"
    : due === 0
    ? "Kích hoạt ngay"
    : `Thanh toán • ${formatMoney(due)}`;

  async function handleConfirm() {
    setProcessing(true);
    setError(null);
    let redirected = false;
    try {
      const { data } = await subscriptionApi.subscribe({
        plan_id: plan.id,
        payment_method: needsMethod ? method : undefined,
        // Người dùng đồng ý bằng việc bấm Thanh toán (thông báo hiển thị ngay phía trên nút)
        auto_renew_consent: showConsent ? true : undefined,
      });

      // Chuyển sang MoMo để xác thực ủy quyền tự động trừ tiền và thanh toán kỳ đầu
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
            {isDowngrade ? "Đổi gói dịch vụ" : "Đăng ký gói dịch vụ"}
          </p>
          <h3 className="mb-5 text-2xl font-extrabold text-slate-900">
            {plan.name}
          </h3>

          {loadingQuote && (
            <div className="mb-6 animate-pulse space-y-3">
              <div className="h-5 w-3/4 rounded bg-gray-100" />
              <div className="h-24 rounded-2xl bg-gray-100" />
            </div>
          )}

          {quoteError && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{quoteError}</span>
            </div>
          )}

          {quote && (
            <>
              <div className="mb-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
                <FiInfo className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span>{quote.summary}</span>
              </div>

              {quote.allowed && !isDowngrade && (
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
              )}

              {isDowngrade && quote.allowed && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-slate-700">
                  <FiCalendar className="h-5 w-5 text-blue-500" />
                  <span>
                    Hiệu lực từ <strong>{formatDate(quote.effectiveAt)}</strong>
                    . Không phát sinh thanh toán hôm nay.
                  </span>
                </div>
              )}

              {!quote.allowed && (
                <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{quote.reason}</span>
                </div>
              )}

              {/* Chọn phương thức thanh toán */}
              {needsMethod && (
                <>
                  <h4 className="mb-3 font-bold text-slate-900">
                    Chọn phương thức thanh toán
                  </h4>
                  <div className="mb-5 space-y-3">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.code}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                          method === m.code
                            ? "border-blue-500 bg-blue-50/30"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={m.code}
                            checked={method === m.code}
                            onChange={(e) => setMethod(e.target.value)}
                            disabled={processing}
                            className="h-5 w-5"
                          />
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${m.color}`}
                          >
                            {m.letter}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.desc}</p>
                          </div>
                        </div>
                        {m.badge && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-600">
                            {m.badge}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  {overCardLimit && (
                    <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>
                        Thanh toán thẻ qua MoMo giới hạn 10.000.000đ mỗi giao
                        dịch. Vui lòng chọn Ví MoMo.
                      </span>
                    </div>
                  )}
                </>
              )}

              {canPay && quote && !quote.recurring && (
                <p className="mb-5 text-xs text-gray-500">
                  Gói trọn đời: thanh toán một lần, không tự động gia hạn.
                </p>
              )}
            </>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">{error.message}</p>
                {ERROR_HINTS[error.code] && (
                  <p className="mt-1 text-red-600">{ERROR_HINTS[error.code]}</p>
                )}
              </div>
            </div>
          )}

          {/* Thông báo minh bạch: bấm Thanh toán = đồng ý ủy quyền tự động gia hạn */}
          {showConsent && (
            <p className="mb-3 text-xs leading-relaxed text-gray-500">
              {consentText(unit)}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={
              processing ||
              loadingQuote ||
              !quote ||
              !quote.allowed ||
              overCardLimit
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {processing ? (
              <FiLoader className="h-5 w-5 animate-spin" />
            ) : (
              <FiLock className="h-5 w-5" />
            )}
            {buttonText}
          </button>

          {processing && (
            <p className="mt-3 text-center text-xs text-gray-500">
              {redirecting
                ? "Bạn sẽ được chuyển sang trang xác thực an toàn của MoMo."
                : "Vui lòng không đóng cửa sổ trong khi hệ thống xử lý."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
