import { FiRefreshCw } from "react-icons/fi";
import { formatDate, formatMoney } from "../../utils/subscriptionFormat";

function description(subscription) {
  const periodEnd = formatDate(subscription.currentPeriodEnd);

  if (subscription.status === "GRACE_PERIOD") {
    return "Gói đang trong thời gian ân hạn, hãy gia hạn để giữ nguyên quyền lợi.";
  }
  if (subscription.autoRenew && subscription.nextBilling) {
    return (
      <>
        Gói đến kỳ gia hạn ngày{" "}
        <strong className="text-slate-800">
          {formatDate(subscription.nextBilling.date)}
        </strong>{" "}
        (
        <strong className="text-slate-800">
          {formatMoney(subscription.nextBilling.amount)}
        </strong>
        , gói {subscription.nextBilling.planName}). Chúng tôi sẽ nhắc bạn trước
        3 ngày, bạn chỉ cần bấm Gia hạn ngay.
      </>
    );
  }
  return `Gia hạn đang tắt. Gói dùng được đến ${periodEnd}, sau đó chuyển về gói Miễn phí.`;
}

export default function RenewalCard({
  subscription,
  busy,
  onRenew,
  onCancel,
  onResume,
}) {
  const inGrace = subscription.status === "GRACE_PERIOD";
  const canResume = subscription.status === "ACTIVE" && !subscription.autoRenew;

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
        <FiRefreshCw className="h-4 w-4 text-blue-500" /> Gia hạn gói
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-gray-600">
        {description(subscription)}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        {subscription.canRenewNow && (
          <button
            onClick={onRenew}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Gia hạn ngay
          </button>
        )}
        {subscription.autoRenew && !inGrace && (
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm font-bold text-red-500 underline hover:text-red-600"
          >
            Hủy gia hạn
          </button>
        )}
        {canResume && (
          <button
            onClick={onResume}
            disabled={busy}
            className="rounded-xl border border-blue-200 px-5 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-60"
          >
            Bật lại gia hạn
          </button>
        )}
      </div>
    </div>
  );
}
