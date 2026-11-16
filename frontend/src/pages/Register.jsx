import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiShield,
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import FormField from "../components/FormField.jsx";
import { authApi } from "../services/api.js";
import { validateRegisterForm } from "../utils/validators.js";
import { EDITORIAL_IMAGES } from "../constants/editorialImages";

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

export default function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    const updatePointer = (e) => {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setPointer({ x, y });
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

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin trong biểu mẫu.");
      return;
    }

    setSubmitting(true);

    try {
      if (authApi?.register) {
        await authApi.register({
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          password: values.password,
        });
      }

      toast.success("Mã xác thực OTP đã được gửi!");
      navigate("/xac-thuc-email", {
        state: {
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký không thành công.";
      toast.error(message);
      if (err.response?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Tính % hoàn thiện biểu mẫu cho thanh tiến độ trong form
  const completedFields = [
    values.fullName.trim().length >= 2,
    values.phone.trim().length >= 9,
    values.email.includes("@"),
    values.password.length >= 8,
    values.confirmPassword.length >= 8 &&
      values.confirmPassword === values.password,
    values.agreeTerms,
  ].filter(Boolean).length;
  const completionPercent = Math.round((completedFields / 6) * 100);

  const staggerClass = (delayStep) =>
    `transition-all duration-700 ease-out ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    } ${delayStep}`;

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-8 text-[#071a36] selection:bg-[#1469db] selection:text-white"
      style={{
        background:
          "radial-gradient(circle at 14% 18%, rgba(20, 105, 219, 0.16), transparent 38%), radial-gradient(circle at 86% 82%, rgba(98, 216, 240, 0.22), transparent 36%), linear-gradient(145deg, #eaf3ff 0%, #f8fbff 52%, #e3f0ff 100%)",
      }}
    >
      {/* Hào quang Xanh Dương di chuyển mượt theo con trỏ chuột */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(560px circle at ${pointer.x}% ${pointer.y}%, rgba(20, 105, 219, 0.11), transparent 70%)`,
        }}
      />

      {/* Thanh điều hướng tối giản góc trên */}
      <div className="fixed top-5 left-5 right-5 sm:top-7 sm:left-8 sm:right-8 z-30 flex items-center justify-between pointer-events-none">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white border border-blue-900/10 backdrop-blur-md text-xs font-semibold text-[#071a36] shadow-sm transition-all"
        >
          <FiArrowLeft className="w-3.5 h-3.5 text-[#1469db]" />
          <span>Trang chủ</span>
        </Link>

        <div className="hidden sm:inline-flex items-center gap-2.5 text-sm font-bold tracking-[3px] text-[#071a36]">
          <FiActivity className="w-4 h-4 text-[#1469db]" />
          <span>
            SENTINEL
            <i className="not-italic font-normal text-[#1469db]">CARE</i>
          </span>
        </div>
      </div>

      {/* Container chính: Ngoại cảnh bên trái, Form bên phải */}
      <div className="relative z-10 w-full max-w-[1180px] grid lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-14 lg:pt-6">
        {/* CỘT TRÁI: Ngoại cảnh tông Xanh Dương & Trắng Băng Sương */}
        <div
          className={`lg:col-span-5 space-y-7 transition-all duration-1000 ease-out ${
            mounted
              ? "opacity-100 translate-y-0 blur-0"
              : "opacity-0 translate-y-8 blur-sm"
          }`}
        >
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1469db]/10 border border-[#1469db]/20 text-[10px] tracking-[2.2px] uppercase text-[#1469db] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1469db] animate-ping" />
              CLINICAL EDGE AI • PRIVACY FIRST
            </span>

            <h1 className="text-4xl sm:text-5xl font-light tracking-[-2px] leading-[1.06] text-[#071a36]">
              Khởi tạo lá chắn.
              <br />
              <em className="font-editorial italic font-normal text-[#1469db] tracking-[-1px]">
                Chăm sóc trọn vẹn.
              </em>
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Thiết lập trạm giám sát gia đình chỉ trong 60 giây — kết nối vòng
              đeo tay cảm biến 3D và mạng lưới cảnh báo SOS tự động 24/7.
            </p>
          </div>

          {/* 1 Khung ảnh biên tập duy nhất */}
          <div className="relative h-60 rounded-[28px] overflow-hidden border border-blue-900/10 shadow-[0_24px_65px_rgba(20,105,219,0.16)] group">
            <img
              src={EDITORIAL_IMAGES.care}
              alt="Chăm sóc người cao tuổi SentinelCare"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000 group-hover:scale-100"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(7,26,54,0.08) 25%, rgba(7,26,54,0.88) 100%)",
              }}
            />
            <div className="absolute left-5 right-5 bottom-4 flex items-center justify-between text-xs text-white">
              <span className="font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#62d8f0] animate-pulse" />
                Zero-Footprint Video • Riêng tư tuyệt đối
              </span>
              <span className="font-mono font-bold text-[#8de6f7]">
                99.4% AI
              </span>
            </div>
          </div>

          {/* 3 bước khởi tạo tinh gọn */}
          <div className="space-y-2.5">
            {[
              {
                step: "01",
                title: "Xác thực OTP bảo mật",
                desc: "Bảo vệ số điện thoại nhận cuộc gọi khẩn cấp SOS.",
              },
              {
                step: "02",
                title: "Gắn kết thiết bị & Người thân",
                desc: "Liên kết vòng đeo tay IMU và hồ sơ bệnh lý nền.",
              },
              {
                step: "03",
                title: "Giám sát & Cứu hộ tự động 24/7",
                desc: "Kích hoạt quy trình phản ứng đa tầng dưới 25 giây.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/85 border border-blue-900/10 backdrop-blur-md shadow-xs"
              >
                <span className="text-xs font-mono font-bold text-[#1469db] bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-lg">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#071a36] flex items-center gap-1.5">
                    {item.title}
                    <FiCheckCircle className="w-3.5 h-3.5 text-[#1469db]" />
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: Form Đăng Ký Xanh Dương - Trắng */}
        <div
          className={`lg:col-span-7 flex justify-center lg:justify-end transition-all duration-1000 delay-150 ease-out ${
            mounted
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-[0.98]"
          }`}
        >
          <div className="w-full max-w-[540px] rounded-[30px] bg-white/95 backdrop-blur-xl text-slate-900 p-6 sm:p-9 shadow-[0_30px_85px_rgba(20,105,219,0.16)] border border-blue-100 relative overflow-hidden">
            {/* Thanh tiến độ hoàn thiện biểu mẫu chạy mượt ở mép trên card */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-50">
              <div
                className="h-full bg-gradient-to-r from-[#0c4eaa] via-[#1469db] to-[#62d8f0] transition-all duration-500 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-bold text-[#1469db] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1469db] animate-pulse" />
                KHỞI TẠO TRẠM GIÁM SÁT
              </div>
              <span className="text-[11px] font-mono font-bold text-[#1469db] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
                {completionPercent}% hoàn tất
              </span>
            </div>

            <h2 className="text-2xl font-black text-[#071a36]">
              Tạo tài khoản mới
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Bắt đầu thiết lập hệ thống giám sát và bảo vệ khẩn cấp cho người
              thân của bạn.
            </p>

            {/* GIỮ NGUYÊN TOÀN BỘ CÁC TRƯỜNG INPUT */}
            <form
              className="mt-5 space-y-3.5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={staggerClass("delay-75")}>
                <FormField
                  label="Họ và tên người quản lý / chủ tài khoản *"
                  name="fullName"
                  icon={FiUser}
                  value={values.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
              </div>

              {/* Input Số điện thoại có +84 */}
              <div className={staggerClass("delay-100")}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ (Nhận cảnh báo SOS) *
                </label>
                <div className="relative flex items-center group">
                  <span className="absolute left-3 bg-blue-50/90 px-2 py-1 rounded text-xs font-bold text-[#071a36] flex items-center gap-1 border border-blue-200/80 transition-colors group-focus-within:border-[#1469db] group-focus-within:bg-blue-100/70">
                    🇻🇳 +84
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    placeholder="912 345 678"
                    className={`w-full pl-24 pr-4 py-2.5 bg-slate-50/80 border rounded-xl text-sm transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#1469db] ${
                      errors.phone ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className={staggerClass("delay-150")}>
                <FormField
                  label="Email liên hệ"
                  name="email"
                  type="email"
                  icon={FiMail}
                  value={values.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="nguyenvanan@example.com"
                />
              </div>

              <div
                className={`grid sm:grid-cols-2 gap-3.5 ${staggerClass(
                  "delay-200"
                )}`}
              >
                <FormField
                  label="Mật khẩu quản trị *"
                  name="password"
                  type="password"
                  icon={FiLock}
                  value={values.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Tối thiểu 8 ký tự..."
                />

                <FormField
                  label="Xác nhận lại mật khẩu *"
                  name="confirmPassword"
                  type="password"
                  icon={FiLock}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <div className={staggerClass("delay-300")}>
                <label className="flex items-start gap-2 text-[11px] text-slate-500 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={values.agreeTerms}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1469db] focus:ring-[#1469db]"
                  />
                  <span>
                    Tôi đồng ý với{" "}
                    <a
                      href="#terms"
                      className="text-[#1469db] font-bold hover:underline"
                    >
                      Điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a
                      href="#privacy"
                      className="text-[#1469db] font-bold hover:underline"
                    >
                      Chính sách bảo mật y tế HIPAA
                    </a>{" "}
                    dành cho dữ liệu sức khoẻ người cao tuổi.
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.agreeTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white font-bold py-3.5 px-6 rounded-xl shadow-[0_12px_28px_rgba(20,105,219,0.28)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #0c4eaa, #1687df)",
                }}
              >
                <span>
                  {submitting
                    ? "Đang khởi tạo tài khoản..."
                    : "Đăng ký & Nhận mã xác thực OTP"}
                </span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">
                HOẶC ĐĂNG KÝ BẰNG
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => toast.info("Tính năng đang phát triển.")}
              className="w-full bg-blue-50/70 hover:bg-blue-100/80 text-[#071a36] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-blue-200/70 transition-colors cursor-pointer"
            >
              <FcGoogle className="w-4 h-4" />
              <span>Tiếp tục với Google Workspace</span>
            </button>

            <p className="mt-5 text-center text-xs text-slate-500 font-medium">
              Đã có tài khoản SentinelCare?{" "}
              <Link
                to="/dang-nhap"
                className="font-bold text-[#1469db] hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
              <FiShield className="w-3.5 h-3.5 text-[#1469db]" />
              <span>
                MÃ HÓA AES-256 &amp; CHUẨN BẢO VỆ DỮ LIỆU SỨC KHỎE QUỐC TẾ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
