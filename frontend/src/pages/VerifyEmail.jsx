import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiShield, FiLock, FiMail, FiCheckCircle } from "react-icons/fi";
import AuthShell from "../components/AuthShell.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function maskEmail(emailStr = "") {
  const [name, domain] = emailStr.split("@");
  if (!domain) return emailStr;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tự động lấy email từ state hoặc dùng fallback email cho việc Test UI
  const email = location.state?.email || "nguyenvanan@carehub.com";

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  const otp = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function handleDigitChange(index, rawValue) {
    const value = rawValue.replace(/\D/g, "");
    if (!value) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (value.length > 1) {
      const pasted = value.slice(0, OTP_LENGTH).split("");
      const next = Array(OTP_LENGTH).fill("");
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      return;
    }

    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      toast.error("Vui lòng nhập đủ 6 số mã OTP.");
      return;
    }

    setSubmitting(true);
    try {
      if (authApi?.verifyOtp) {
        const { data } = await authApi.verifyOtp({ email, otp });
        login(data.accessToken, data.user);
      }
      toast.success("Xác thực email thành công!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Mã OTP xác thực không đúng.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      if (authApi?.resendOtp) {
        await authApi.resendOtp({ email });
      }
      toast.success("Đã gửi lại mã OTP tới email của bạn.");
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Không thể gửi lại mã OTP."
      );
    } finally {
      setResending(false);
    }
  }

  // Cột trái chuẩn giao diện Y tế (Ảnh 3)
  const leftPanelContent = (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider">
        KÊNH XÁC THỰC CẤP 1
      </div>

      <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
        Bảo vệ định danh y tế <span className="text-blue-600">24/7</span>
      </h1>

      <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
        Giao thức mã hóa lượng tử đa yếu tố đảm bảo dữ liệu té ngã và cảnh báo
        sinh tồn của bệnh nhân chỉ được kết nối với người giám hộ được cấp
        quyền.
      </p>

      {/* AES-256 Signal Graph Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2 text-blue-600">
            <FiShield className="w-4 h-4" /> ĐƯỜNG TRUYỀN AES-256
          </span>
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
            HOẠT ĐỘNG
          </span>
        </div>

        {/* Dynamic Signal Bars */}
        <div className="h-20 flex items-end gap-2 pt-2">
          <div className="flex-1 bg-blue-100 h-10 rounded-md"></div>
          <div className="flex-1 bg-blue-200 h-12 rounded-md"></div>
          <div className="flex-1 bg-blue-300 h-14 rounded-md"></div>
          <div className="flex-1 bg-blue-400 h-16 rounded-md"></div>
          <div className="flex-1 bg-blue-600 h-20 rounded-md"></div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-100">
          <span>Độ trễ tín hiệu Email Gateway</span>
          <strong className="text-slate-800 font-mono">0.42 Giây</strong>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <FiLock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-xs">
            Tiêu chuẩn Giám sát Y tế Khẩn cấp
          </h4>
          <p className="text-[11px] text-slate-500">
            Hệ thống tuân thủ nghiêm ngặt bảo mật hồ sơ sức khỏe và định vị
            radar theo thời gian thực.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AuthShell leftContent={leftPanelContent}>
      {/* Icon Đầu Card */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
        <FiMail className="h-7 w-7" />
      </div>

      <h2 className="text-center text-2xl font-black text-slate-900">
        Xác thực Email
      </h2>
      <p className="mt-1 text-center text-xs text-slate-400">
        Mã OTP bảo mật 6 số đã được gửi tới địa chỉ email
      </p>

      {/* Badges hiển thị Email dạng Masking */}
      <div className="mt-3 text-center text-xs font-mono font-bold text-slate-800 bg-slate-100 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 w-max mx-auto border border-slate-200">
        <FiMail className="w-3.5 h-3.5 text-blue-600" />
        <span>{maskEmail(email)}</span>
        <Link
          to="/dang-ky"
          className="text-blue-600 text-[10px] uppercase font-bold hover:underline ml-1"
        >
          THAY ĐỔI
        </Link>
      </div>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
        {/* 6 Box Input OTP */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-11 sm:w-12 rounded-xl border-2 border-slate-200 text-center text-xl font-black text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 bg-slate-50"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0052cc] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>Xác nhận & Hoàn tất đăng ký</span>
        </button>

        <div className="text-center text-xs text-slate-500 space-y-2">
          {secondsLeft > 0 ? (
            <span>
              Gửi lại mã sau{" "}
              <strong className="font-mono text-blue-600">
                {String(secondsLeft).padStart(2, "0")}s
              </strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-blue-600 hover:underline cursor-pointer disabled:opacity-60"
            >
              {resending
                ? "Đang gửi..."
                : "Chưa nhận được mã? Gửi lại qua Email"}
            </button>
          )}
        </div>
      </form>

      {/* Cam kết quyền riêng tư Y tế */}
      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-500">
        <FiShield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 block">
            CAM KẾT QUYỀN RIÊNG TƯ Y TẾ
          </strong>
          Mã OTP đảm bảo chỉ người giám hộ hợp pháp mới có quyền truy cập thông
          tin vị trí và tình trạng sức khỏe của người thân.
        </div>
      </div>
    </AuthShell>
  );
}
