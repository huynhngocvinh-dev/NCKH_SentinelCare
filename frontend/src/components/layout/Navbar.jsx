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
  FiStar
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isLoggedIn = isAuthenticated || Boolean(user);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-6 lg:px-12 font-mono border-b border-slate-800/80">
        <div className="w-full flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-md border border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FUSION PIPELINE V4.2 LIVE
            </span>
            <span className="hidden sm:inline text-slate-300">
              Độ trễ xử lý: <strong className="text-white font-bold">82ms</strong>
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline text-slate-300">
              Bảo mật Y khoa:{" "}
              <strong className="text-emerald-400 font-bold">HL7 / FHIR / HIPAA</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden xl:inline flex items-center gap-1.5">
              <FiActivity className="w-4 h-4 text-blue-400" /> 6-Axis IMU (100Hz) & Edge-Vision
            </span>
            <span className="bg-slate-900 px-3 py-1 rounded text-xs text-slate-300 font-medium border border-slate-800">
              NODE ID: FG-HANOI-CLINIC-09
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation - Dùng w-full và padding rộng linh hoạt theo màn hình */}
      <div className="w-full px-6 lg:px-12 h-24 flex items-center justify-between gap-8">
        {/* Logo Brand */}
        <div
          className="flex items-center gap-4 cursor-pointer group shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-all">
            <FiShield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                SentinelCare
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        {isLoggedIn ? (
          /* ================= MENU KHI ĐÃ ĐĂNG NHẬP ================= */
          <nav className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive("/")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiHome className="w-4 h-4" />
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => navigate("/cai-dat-thiet-bi")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive("/cai-dat-thiet-bi")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiCpu className="w-4 h-4" />
              <span>Thiết bị</span>
            </button>

            <button
              onClick={() => navigate("/nguoi-than")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive("/nguoi-than")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Người thân</span>
            </button>

            <button
              onClick={() => navigate("/lich-su")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive("/lich-su")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiClock className="w-4 h-4" />
              <span>Lịch sử</span>
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                isActive("/pricing") || isActive("/subscription")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiStar className="w-4 h-4" />
              <span>Dịch vụ</span>
            </button>
          </nav>
        ) : (
          /* ================= MENU KHI CHƯA ĐĂNG NHẬP ================= */
          <nav className="hidden lg:flex items-center gap-8 text-base font-bold text-slate-700">
            <a href="#giai-phap" className="hover:text-blue-600 transition-colors">
              Giải Pháp
            </a>
            <a href="#cong-nghe" className="hover:text-blue-600 transition-colors">
              Công Nghệ Đa Luồng
            </a>
            <a href="#grace-period" className="hover:text-blue-600 transition-colors">
              Chống Báo Giả 25s
            </a>
            <a href="#phan-cap" className="hover:text-blue-600 transition-colors">
              Phân Cấp Cứu Hộ
            </a>
            <span
              onClick={() => navigate("/pricing")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Bảng Giá
            </span>
            <a
              href="#demo-live"
              className="text-blue-600 font-extrabold bg-blue-50 px-5 py-3 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all shadow-xs"
            >
              Trải Nghiệm Live Demo
            </a>
          </nav>
        )}

        {/* Nút Đăng nhập / Đăng ký */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/tai-khoan")}
              title="Quản lý tài khoản cá nhân"
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <FiUser className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/dang-nhap")}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                <FiLogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>

              <button
                onClick={() => navigate("/dang-ky")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer hover:scale-[1.02]"
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