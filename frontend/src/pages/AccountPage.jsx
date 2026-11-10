import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiChevronRight,
  FiClock,
  FiCpu,
  FiCreditCard,
  FiLogOut,
  FiMail,
  FiPhone,
  FiUsers,
} from "react-icons/fi";
import AccountCard from "../components/AccountCard";
import { useAuth } from "../context/AuthContext.jsx";
import { useSubscription } from "../hooks/useSubscription";
import { STATUS_META, formatDate } from "../utils/subscriptionFormat";

const SHORTCUTS = [
  {
    to: "/goi-cua-toi",
    icon: FiCreditCard,
    title: "Gói dịch vụ & thanh toán",
    desc: "Gói hiện tại, gia hạn tự động, hóa đơn",
  },
  {
    to: "/nguoi-than",
    icon: FiUsers,
    title: "Người thân nhận cảnh báo",
    desc: "Thứ tự ưu tiên khi có sự cố",
  },
  {
    to: "/cai-dat-thiet-bi",
    icon: FiCpu,
    title: "Thiết bị",
    desc: "Camera AI và thiết bị đeo",
  },
  {
    to: "/lich-su",
    icon: FiClock,
    title: "Lịch sử sự cố",
    desc: "Các sự cố đã ghi nhận",
  },
];

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { subscription } = useSubscription();

  async function handleLogout() {
    await logout();
    toast.success("Đã đăng xuất.");
  }

  const status = STATUS_META[subscription?.status] ?? STATUS_META.FREE;
  const isFree = !subscription || subscription.status === "FREE";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Thẻ tài khoản (giống Google) */}
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
          <AccountCard user={user} subscription={subscription} size="lg" />

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <FiMail /> Email
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800 break-all">
                {user?.email}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <FiPhone /> Số điện thoại
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {user?.phoneNumber || "Chưa cập nhật"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tóm tắt gói dịch vụ */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Gói dịch vụ
              </p>
              <h2 className="text-xl font-extrabold text-slate-900">
                {subscription?.planName ?? "Miễn phí"}
              </h2>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${status.cls}`}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {isFree
              ? "Nâng cấp để nhận cảnh báo qua email kèm giọng đọc AI và gọi điện tự động theo thứ tự ưu tiên."
              : subscription.lifetime
              ? "Gói trọn đời, không cần gia hạn."
              : subscription.autoRenew && subscription.nextBilling
              ? `Đến kỳ gia hạn ngày ${formatDate(
                  subscription.nextBilling.date
                )}
              , bạn sẽ được nhắc để gia hạn.`
              : `Gói dùng được đến ${formatDate(
                  subscription.currentPeriodEnd
                )}, không tự động gia hạn.`}
          </p>

          <Link
            to={isFree ? "/bang-gia" : "/goi-cua-toi"}
            className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            {isFree ? "Xem các gói" : "Quản lý gói dịch vụ"}
          </Link>
        </div>

        {/* Lối tắt */}
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 divide-y divide-slate-100">
          {SHORTCUTS.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <FiChevronRight className="text-slate-300" />
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          <FiLogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
