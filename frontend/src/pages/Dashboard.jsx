import { FiLogOut, FiShield, FiHeart, FiActivity } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    toast.success("Đã đăng xuất.");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <FiShield className="h-5 w-5" />
            <span className="font-bold text-lg text-slate-900">
              SentinelCare
            </span>
          </div>
        </header>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h1 className="text-xl font-semibold text-slate-900">
            Chào mừng, {user?.fullName || "bạn"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tài khoản của bạn đã được xác thực. Đây là trang được bảo vệ bởi
            ProtectedRoute — chỉ người dùng đã đăng nhập mới truy cập được.
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50">
              <dt className="text-xs text-slate-400 font-medium">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {user?.email}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50">
              <dt className="text-xs text-slate-400 font-medium">
                Số điện thoại
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {user?.phone || "Chưa cập nhật"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-blue-50/70 p-4 text-blue-700 border border-blue-100">
              <FiHeart className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium">Nhịp tim</p>
                <p className="font-bold text-blue-600">74 BPM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 p-4 text-emerald-700 border border-emerald-100">
              <FiActivity className="h-5 w-5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-medium">Trạng thái</p>
                <p className="font-bold text-emerald-600">
                  Ổn định — không phát hiện bất thường
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
