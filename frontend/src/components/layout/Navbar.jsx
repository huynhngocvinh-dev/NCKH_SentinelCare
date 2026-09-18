import {
  FiShield,
  FiActivity,
  FiLogIn,
  FiUserPlus,
  FiCpu,
  FiHome,
  FiUsers,
  FiClock,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isLoggedIn = isAuthenticated || Boolean(user);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 font-mono flex flex-wrap justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FUSION PIPELINE V4.2 LIVE
          </span>
          <span>
            Độ trễ xử lý: <strong className="text-white">82ms</strong>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline">
            Bảo mật Y khoa:{" "}
            <strong className="text-emerald-400">HL7 / FHIR / HIPAA</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="hidden sm:inline flex items-center gap-1">
            <FiActivity className="w-3.5 h-3.5 text-blue-400" /> 6-Axis IMU
            (100Hz) & Edge-Vision
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
            NODE ID: FG-HANOI-CLINIC-09
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* KHU VỰC BÊN TRÁI: LOGO + MENU ĐI KÈM KẾ BÊN */}
        <div className="flex items-center gap-8">
          {/* Logo Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FiShield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  SentinelCare
                </span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  AI CORE
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Telecare Incident Core
              </p>
            </div>
          </div>

          {/* Menu khi đã đăng nhập (Đứng ngay cạnh Logo) */}
          {isLoggedIn && (
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FiHome className="w-4 h-4" />
                <span>Trang chủ</span>
              </button>

              <button
                onClick={() => navigate("/cai-dat-thiet-bi")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive("/cai-dat-thiet-bi")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FiCpu className="w-4 h-4" />
                <span>Thiết bị</span>
              </button>

              <button
                onClick={() => navigate("/nguoi-than")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive("/nguoi-than")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FiUsers className="w-4 h-4" />
                <span>Người thân</span>
              </button>

              <button
                onClick={() => navigate("/lich-su")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive("/lich-su")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FiClock className="w-4 h-4" />
                <span>Lịch sử</span>
              </button>
            </nav>
          )}

          {/* Menu Landing Page khi chưa đăng nhập */}
          {!isLoggedIn && (
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a
                href="#giai-phap"
                className="hover:text-blue-600 transition-colors"
              >
                Giải Pháp
              </a>
              <a
                href="#cong-nghe"
                className="hover:text-blue-600 transition-colors"
              >
                Công Nghệ Đa Luồng
              </a>
              <a
                href="#grace-period"
                className="hover:text-blue-600 transition-colors"
              >
                Chống Báo Giả 25s
              </a>
              <a
                href="#phan-cap"
                className="hover:text-blue-600 transition-colors"
              >
                Phân Cấp Cứu Hộ
              </a>
              <a
                href="#bang-gia"
                className="hover:text-blue-600 transition-colors"
              >
                Bảng Giá
              </a>
            </nav>
          )}
        </div>

        {/* KHU VỰC BÊN PHẢI */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/tai-khoan")}
                title="Quản lý tài khoản cá nhân"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer shadow-sm"
              >
                <FiUser className="w-5 h-5" />
              </button>

              <button
                onClick={logout}
                title="Đăng xuất"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/dang-nhap")}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <FiLogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>

              <button
                onClick={() => navigate("/dang-ky")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <FiUserPlus className="w-4 h-4" />
                <span>Đăng ký</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
