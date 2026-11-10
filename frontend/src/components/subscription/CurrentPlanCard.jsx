import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiCheck } from "react-icons/fi";
import { STATUS_META, formatDate } from "../../utils/subscriptionFormat";

function periodText(subscription) {
  if (subscription.status === "FREE") return "Không giới hạn thời gian";
  if (subscription.lifetime) return "Trọn đời";
  return `Đến ${formatDate(subscription.currentPeriodEnd)} (còn ${
    subscription.daysRemaining
  } ngày)`;
}

export default function CurrentPlanCard({ subscription }) {
  const status = STATUS_META[subscription.status] || STATUS_META.ACTIVE;
  const isFree = subscription.status === "FREE";
  const inGrace = subscription.status === "GRACE_PERIOD";

  const progress = useMemo(() => {
    if (!subscription.currentPeriodEnd) return null;
    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    if (end <= start) return 100;
    return Math.min(
      100,
      Math.max(0, ((Date.now() - start) / (end - start)) * 100)
    );
  }, [subscription.currentPeriodStart, subscription.currentPeriodEnd]);

  return (
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
          <div>
            <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-gray-400">
              Thời hạn gói
            </p>
            <p className="font-bold text-slate-900">
              {periodText(subscription)}
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
                inGrace ? "bg-amber-500" : "bg-blue-500"
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
            {subscription.features.map((feature) => (
              <div key={feature.id} className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-500">
                  <FiCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {feature.name}
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
  );
}
