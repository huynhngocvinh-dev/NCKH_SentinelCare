import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiAlertTriangle, FiCalendar } from "react-icons/fi";
import ActivityPanel from "../components/subscription/ActivityPanel";
import CancelRenewalModal from "../components/subscription/CancelRenewalModal";
import CurrentPlanCard from "../components/subscription/CurrentPlanCard";
import RenewalCard from "../components/subscription/RenewalCard";
import PaymentModal from "../components/PaymentModal";
import { subscriptionApi } from "../services/api";
import { useSubscription } from "../hooks/useSubscription";
import { useSubscriptionPush } from "../hooks/useSubscriptionPush";
import { formatDate, formatMoney } from "../utils/subscriptionFormat";

// Gói được tính tiền ở lần gia hạn tới: gói hạ đã lên lịch, nếu không thì gói hiện tại
function renewalPlanOf(subscription) {
  const pending = subscription.pendingChange;
  return pending
    ? { id: pending.planId, name: pending.planName, price: pending.amount }
    : {
        id: subscription.planId,
        name: subscription.planName,
        price: subscription.price,
      };
}

function Banner({ tone, icon: Icon, title, action, children }) {
  const tones = {
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-blue-100 bg-blue-50 text-blue-900",
  };
  return (
    <div
      className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${tones[tone]}`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <div className="flex-1 text-sm leading-relaxed">
        <p className="font-bold">{title}</p>
        <p>{children}</p>
      </div>
      {action}
    </div>
  );
}

export default function SubscriptionManagePage() {
  const { subscription, loading, error, refresh, patch, replace } =
    useSubscription();
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const bumpActivity = () => setRefreshSignal((n) => n + 1);

  // Server đẩy sự kiện (đến hạn, thanh toán, hết hạn...): cập nhật ngay
  useSubscriptionPush(() => {
    refresh();
    bumpActivity();
  });

  // Thực hiện thao tác với phản hồi tức thì; hoàn lại giao diện nếu server từ chối
  async function runOptimistic({
    optimisticPatch,
    request,
    successMessage,
    failureMessage,
  }) {
    const previous = subscription;
    patch(optimisticPatch);
    setBusy(true);
    try {
      const { data } = await request();
      if (data?.planId) replace(data);
      toast.success(successMessage(data));
      bumpActivity();
    } catch (err) {
      replace(previous);
      toast.error(err.message || failureMessage);
    } finally {
      setBusy(false);
    }
  }

  const handleCancel = async ({ reason, feedback }) => {
    await runOptimistic({
      optimisticPatch: { autoRenew: false, nextBilling: null },
      request: () => subscriptionApi.cancelAutoRenew({ reason, feedback }),
      successMessage: (data) =>
        `Đã hủy gia hạn. Bạn vẫn dùng được gói đến ${formatDate(
          data.currentPeriodEnd
        )}.`,
      failureMessage: "Không thể hủy gia hạn.",
    });
    setCancelOpen(false);
  };

  const handleResume = () =>
    runOptimistic({
      optimisticPatch: { autoRenew: true },
      request: () => subscriptionApi.resumeAutoRenew(),
      successMessage: () => "Đã bật lại gia hạn.",
      failureMessage: "Không thể bật lại gia hạn.",
    });

  const handleCancelPendingChange = () =>
    runOptimistic({
      optimisticPatch: { pendingChange: null },
      request: () => subscriptionApi.cancelPendingChange(),
      successMessage: () => "Đã hủy thay đổi gói đang chờ.",
      failureMessage: "Không thể hủy thay đổi gói.",
    });

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

  const isFree = subscription.status === "FREE";
  const inGrace = subscription.status === "GRACE_PERIOD";
  const hasRenewal = !isFree && !subscription.lifetime;

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

        {inGrace && (
          <Banner
            tone="warn"
            icon={FiAlertTriangle}
            title="Đã đến kỳ gia hạn"
            action={
              <button
                onClick={() => setRenewOpen(true)}
                disabled={busy}
                className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Gia hạn ngay
              </button>
            }
          >
            Bạn vẫn giữ nguyên quyền lợi đến hết{" "}
            <strong>{formatDate(subscription.gracePeriodEnd)}</strong>. Hãy gia
            hạn trước thời hạn này; hệ thống sẽ nhắc lại mỗi 24 giờ.
          </Banner>
        )}

        {subscription.pendingChange && (
          <Banner
            tone="info"
            icon={FiCalendar}
            title={`Đã lên lịch đổi sang ${subscription.pendingChange.planName}`}
            action={
              <button
                onClick={handleCancelPendingChange}
                disabled={busy}
                className="shrink-0 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                Hủy thay đổi
              </button>
            }
          >
            Bạn vẫn dùng gói {subscription.planName} đến hết{" "}
            {formatDate(subscription.pendingChange.effectiveAt)}. Từ ngày đó gói
            mới ({formatMoney(subscription.pendingChange.amount)}) bắt đầu.
          </Banner>
        )}

        <CurrentPlanCard subscription={subscription} />

        {hasRenewal && (
          <RenewalCard
            subscription={subscription}
            busy={busy}
            onRenew={() => setRenewOpen(true)}
            onCancel={() => setCancelOpen(true)}
            onResume={handleResume}
          />
        )}

        <ActivityPanel refreshSignal={refreshSignal} />
      </div>

      <CancelRenewalModal
        open={cancelOpen}
        periodEndText={formatDate(subscription.currentPeriodEnd)}
        busy={busy}
        onConfirm={handleCancel}
        onClose={() => setCancelOpen(false)}
      />

      <PaymentModal
        isOpen={renewOpen}
        mode="renew"
        plan={renewalPlanOf(subscription)}
        onClose={() => setRenewOpen(false)}
        onDone={() => setRenewOpen(false)}
      />
    </div>
  );
}
