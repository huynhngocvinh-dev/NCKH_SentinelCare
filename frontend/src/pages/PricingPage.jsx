import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiAlertTriangle, FiCheck, FiLock } from "react-icons/fi";
import PaymentModal from "../components/PaymentModal";
import { subscriptionApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import {
  billingUnit,
  formatDate,
  formatMoney,
} from "../utils/subscriptionFormat";

const UI_META = {
  FREEMIUM: {
    tag: "BẮT ĐẦU",
    desc: "Những tính năng thiết yếu để luôn được kết nối.",
    isPro: false,
  },
  PRO_1YR: {
    tag: "BẢO VỆ TOÀN DIỆN",
    desc: "Phản ứng nhanh hơn khi mỗi giây đều quan trọng.",
    isPro: true,
  },
  PREMIUM_LIFETIME: {
    tag: "AN TÂM TRỌN ĐỜI",
    desc: "Một lần thanh toán, bảo vệ dài lâu cho gia đình.",
    isPro: false,
  },
};

const periodLabel = (plan) => {
  if (Number(plan.price) === 0) return "miễn phí";
  const unit = billingUnit(plan);
  return unit ? `/ ${unit}` : "một lần, trọn đời";
};

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializing } = useAuth();
  const { subscription, loading: subLoading, refresh } = useSubscription();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    let active = true;
    subscriptionApi
      .getPlans()
      .then(({ data }) => active && setPlans(data))
      .catch(
        (err) =>
          active && setLoadError(err.message || "Không thể tải bảng giá.")
      )
      .finally(() => active && setLoadingPlans(false));
    return () => {
      active = false;
    };
  }, []);

  const currentPrice = subscription ? Number(subscription.price) : 0;
  const isFreeNow = !subscription || subscription.status === "FREE";
  const gracePeriod = subscription?.status === "GRACE_PERIOD";

  // Nhãn và trạng thái nút theo gói đang dùng
  function getCta(plan) {
    const price = Number(plan.price);

    if (!isAuthenticated || !subscription) {
      return { text: price === 0 ? "Bắt đầu miễn phí" : "Chọn gói này" };
    }
    if (subscription.pendingChange?.planId === plan.id) {
      return {
        text: `Đã lên lịch từ ${formatDate(
          subscription.pendingChange.effectiveAt
        )}`,
        disabled: true,
      };
    }
    if (plan.id === subscription.planId) {
      return gracePeriod && price > 0
        ? { text: "Thanh toán ngay để giữ gói", urgent: true }
        : { text: "Đang sử dụng", disabled: true };
    }
    if (price === 0) {
      return {
        text: "Hủy gia hạn để về gói Miễn phí",
        secondary: true,
        goManage: true,
      };
    }
    if (price > currentPrice) {
      return { text: isFreeNow ? "Mua ngay" : "Nâng cấp ngay" };
    }
    return { text: "Hạ xuống gói này", secondary: true };
  }

  function handleSelect(plan, cta) {
    if (!isAuthenticated) {
      if (Number(plan.price) === 0) {
        navigate("/dang-ky");
      } else {
        toast.info("Vui lòng đăng nhập để đăng ký gói dịch vụ.");
        navigate("/dang-nhap", { state: { from: location } });
      }
      return;
    }
    if (cta.goManage) {
      navigate("/goi-cua-toi");
      return;
    }
    setSelectedPlan(plan);
  }

  async function handleDone(result) {
    setSelectedPlan(null);
    toast.success(result.message);
    await refresh();
    navigate("/goi-cua-toi");
  }

  const showSkeleton =
    loadingPlans ||
    initializing ||
    (isAuthenticated && subLoading && !subscription);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="mb-10 flex justify-center gap-8 text-sm font-semibold text-gray-500">
          <span className="border-b-2 border-blue-600 pb-1 text-slate-900">
            Bảng giá
          </span>
          <Link to="/goi-cua-toi" className="pb-1 hover:text-slate-900">
            Gói của tôi
          </Link>
        </div>

        {gracePeriod && (
          <div className="mb-10 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span>
              Thanh toán gia hạn gói <strong>{subscription.planName}</strong>{" "}
              chưa thành công. Bạn vẫn giữ nguyên quyền lợi đến hết{" "}
              <strong>{formatDate(subscription.gracePeriodEnd)}</strong>. Hãy
              thanh toán trước thời hạn này để không bị hạ về gói Miễn phí.
            </span>
          </div>
        )}

        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">
            GÓI DỊCH VỤ
          </p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-[#0B2545] md:text-5xl">
            Bảo vệ bạn và người thân <br />
            <span className="text-blue-600">trong mọi khoảnh khắc.</span>
          </h1>
          <p className="text-lg text-gray-500">
            Chọn mức bảo vệ phù hợp. Nâng cấp ngay, hạ gói từ kỳ sau, hủy gia
            hạn bất cứ lúc nào.
          </p>
        </div>

        {loadError && (
          <div className="py-10 text-center font-bold text-red-500">
            {loadError}
          </div>
        )}

        {showSkeleton ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 flex-1 animate-pulse rounded-3xl bg-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-stretch justify-center gap-6 lg:flex-row">
            {plans.length === 0 && !loadError ? (
              <div className="w-full py-10 text-center font-bold text-red-500">
                Chưa có gói dịch vụ nào đang bán.
              </div>
            ) : (
              plans.map((plan) => {
                const ui = UI_META[plan.code] || {
                  tag: "GÓI DỊCH VỤ",
                  desc: "",
                  isPro: false,
                };
                const cta = getCta(plan);
                const price = Number(plan.price);

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-1 flex-col rounded-3xl bg-white p-8 transition-all ${
                      ui.isPro
                        ? "z-10 border-2 border-blue-500 shadow-2xl shadow-blue-100 lg:scale-105"
                        : "border border-gray-200 shadow-sm"
                    }`}
                  >
                    {ui.isPro && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="rounded-full bg-blue-600 px-6 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-md">
                          PHỔ BIẾN NHẤT
                        </span>
                      </div>
                    )}

                    <p className="mb-2 mt-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                      {ui.tag}
                    </p>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">
                      {plan.name}
                    </h3>

                    <div className="mb-3">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {price === 0 ? "0đ" : formatMoney(price)}
                      </span>
                      <span className="font-medium text-gray-500">
                        {" "}
                        {periodLabel(plan)}
                      </span>
                    </div>
                    <p className="mb-6 min-h-[2.5rem] text-sm text-gray-500">
                      {ui.desc}
                    </p>

                    <div className="mb-6 h-px w-full bg-gray-100" />
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                      BAO GỒM
                    </p>

                    <ul className="mb-8 flex-1 space-y-4">
                      {plan.features?.map((feature) => (
                        <li key={feature.id} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-1 ${
                              ui.isPro
                                ? "bg-blue-600 text-white"
                                : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            <FiCheck className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelect(plan, cta)}
                      disabled={cta.disabled}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition ${
                        cta.disabled
                          ? "cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400"
                          : cta.urgent
                          ? "cursor-pointer bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600"
                          : cta.secondary
                          ? "cursor-pointer border-2 border-blue-100 text-blue-600 hover:bg-blue-50"
                          : "cursor-pointer bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                      }`}
                    >
                      {cta.text}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2 text-center text-sm font-medium text-gray-400">
          <FiLock className="h-4 w-4" />
          Giá đã bao gồm thuế. Không có chi phí ẩn. Hủy tự động gia hạn bất cứ
          lúc nào.
        </div>
      </div>

      <PaymentModal
        isOpen={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        onDone={handleDone}
      />
    </div>
  );
}
