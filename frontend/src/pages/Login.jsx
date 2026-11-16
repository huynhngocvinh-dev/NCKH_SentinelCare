import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiShield,
  FiUser,
  FiLock,
  FiArrowRight,
  FiActivity,
  FiHeart,
  FiArrowLeft,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import FormField from "../components/FormField.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { validateLoginForm } from "../utils/validators.js";
import { EDITORIAL_IMAGES } from "../constants/editorialImages";

const initialValues = { identifier: "", password: "", remember: true };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    const updatePointer = (e) => {
      document.documentElement.style.setProperty(
        "--pointer-x",
        `${e.clientX}px`
      );
      document.documentElement.style.setProperty(
        "--pointer-y",
        `${e.clientY}px`
      );
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("pointermove", updatePointer);
    };
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin đăng nhập.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await authApi.login({
        email: values.identifier.trim(),
        password: values.password,
        remember: values.remember,
      });
      login(data);
      toast.success(`Chào mừng trở lại, ${data.fullName || "Bạn"}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        toast.error("Tài khoản chưa xác thực. Vui lòng nhập mã OTP.");
        navigate("/xac-thuc-email", {
          state: { email: err.response.data.email },
        });
        return;
      }
      toast.error(
        err.response?.data?.message || err.message || "Đăng nhập thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-8 text-white selection:bg-[#1469db] selection:text-white"
      style={{
        background:
          "radial-gradient(circle at 18% 22%, rgba(20, 105, 219, 0.36), transparent 34%), radial-gradient(circle at 85% 78%, rgba(98, 216, 240, 0.16), transparent 30%), #071b3b",
      }}
    >
      {/* Ánh sáng tương tác theo con trỏ chuột giống Hero trang chủ */}
      <div className="fixed inset-0 pointer-events-none hero-pointer-glow" />

      {/* Nút quay về trang chủ tinh gọn ở góc trên */}
      <div className="fixed top-5 left-5 sm:top-7 sm:left-8 z-30 flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-xs font-medium text-sky-100 transition-all"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
      </div>

      {/* Container chính 2 cột cân đối, thoáng mắt */}
      <div className="relative z-10 w-full max-w-[1160px] grid lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-12 lg:pt-0">
        {/* CỘT TRÁI: Ngoại cảnh tối giản chuẩn Figma Blue Motion */}
        <div
          className={`lg:col-span-6 space-y-8 transition-all duration-1000 ease-out ${
            mounted
              ? "opacity-100 translate-y-0 blur-0"
              : "opacity-0 translate-y-8 blur-sm"
          }`}
        >
          {/* Brand Wordmark */}
          <div className="inline-flex items-center gap-2.5 text-base font-semibold tracking-[3px]">
            <FiActivity className="w-5 h-5 text-[#72f1ce]" />
            <span>
              SENTINEL
              <i className="not-italic font-light text-[#8de6f7]">CARE</i>
            </span>
          </div>

          {/* Editorial Headline */}
          <div className="space-y-4">
            <p className="text-[10px] tracking-[2.4px] uppercase text-[#86dff4] font-semibold">
              MULTIMODAL AI &amp; IOT TELEREHABILITATION
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light tracking-[-2px] leading-[1.05]">
              An tâm trọn vẹn.
              <br />
              <em className="font-editorial italic font-normal text-[#a8eafb] tracking-[-1px]">
                Giám sát bằng trí tuệ.
              </em>
            </h1>
            <p className="text-sm text-sky-100/75 leading-relaxed max-w-md font-normal">
              Kết nối trực tiếp với hệ thống cảm biến gia tốc 3D và Camera Edge
              AI bảo vệ người thân 24/7.
            </p>
          </div>

          {/* 1 Visual Frame tinh gọn duy nhất thay cho 4 card cũ */}
          <div className="relative h-[300px] sm:h-[330px] rounded-[28px] overflow-hidden border border-white/20 shadow-[0_30px_80px_rgba(2,18,45,0.5)] group">
            <img
              src={EDITORIAL_IMAGES.room}
              alt="Không gian sống an toàn SentinelCare"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000 group-hover:scale-100"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,24,54,0.15) 20%, rgba(5,20,46,0.88) 100%)",
              }}
            />

            {/* Khung quét AI góc nhẹ nhàng */}
            <div className="absolute left-[34%] top-[22%] w-[32%] h-[46%] pointer-events-none">
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#8ce8f4]" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#8ce8f4]" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#8ce8f4]" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#8ce8f4]" />
            </div>

            {/* Thanh trạng thái gọn ở đáy ảnh */}
            <div className="absolute left-5 right-5 bottom-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#072654]/75 backdrop-blur-md border border-white/15 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full live-dot" />
                <span className="font-medium text-white">
                  Trạm Phòng 402 • Tư thế ổn định
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8de6f7] font-mono font-bold">
                <FiHeart className="w-3.5 h-3.5 text-rose-400" />
                <span>74 BPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Form Đăng Nhập (Giữ nguyên toàn bộ trường & logic) */}
        <div
          className={`lg:col-span-6 flex justify-center lg:justify-end transition-all duration-1000 delay-150 ease-out ${
            mounted
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-[0.98]"
          }`}
        >
          <div className="w-full max-w-[460px] rounded-[28px] bg-[#f8fbff] text-slate-900 p-7 sm:p-9 shadow-[0_32px_90px_rgba(2,16,40,0.55)] border border-white/60">
            {/* Icon Shield Đầu Card */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1469db] mb-4 border border-blue-100">
              <FiShield className="h-6 w-6" />
            </div>

            <h2 className="text-center text-2xl font-black text-[#071a36]">
              Đăng nhập SentinelCare
            </h2>
            <p className="mt-1 text-center text-xs text-slate-500">
              Hệ thống giám sát té ngã và cảnh báo y tế thời gian thực
            </p>

            {/* GIỮ NGUYÊN TOÀN BỘ CÁC TRƯỜNG TRONG FORM */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <FormField
                label=" Email"
                name="identifier"
                icon={FiUser}
                value={values.identifier}
                onChange={handleChange}
                error={errors.identifier}
                placeholder="name@carehub.com"
                autoComplete="username"
              />

              <FormField
                label="Mật khẩu"
                name="password"
                type="password"
                icon={FiLock}
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={values.remember}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Vui lòng liên hệ quản trị viên hệ thống.")
                  }
                  className="font-bold text-[#1469db] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white font-bold py-3.5 px-6 rounded-xl shadow-[0_12px_28px_rgba(20,105,219,0.28)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #0c4eaa, #1687df)",
                }}
              >
                <span>{submitting ? "Đang xác thực..." : "Đăng nhập"}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                HOẶC ĐĂNG NHẬP NHANH BẰNG
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() =>
                toast.info("Tính năng Google Workspace đang được phát triển.")
              }
              className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <FcGoogle className="w-4 h-4" />
              <span>Tài khoản Google Workspace Y Tế</span>
            </button>

            <p className="mt-6 text-center text-xs text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link
                to="/dang-ky"
                className="font-bold text-[#1469db] hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>

            {/* Server Status Box ở đáy Card */}
            <div className="mt-6 bg-[#eef6ff] border border-blue-200/60 rounded-xl p-3 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1469db] animate-pulse"></span>
                <div>
                  <div className="font-bold text-[#071a36]">
                    Máy chủ Telemetry &amp; Cảnh báo 115
                  </div>
                  <div className="text-slate-500">Hoạt động bình thường</div>
                </div>
              </div>
              <span className="font-mono font-bold text-[#1469db] bg-white px-2 py-0.5 rounded border border-blue-100">
                99.98%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
