import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiShield,
  FiUser,
  FiLock,
  FiArrowRight,
  FiRadio,
  FiClock,
  FiActivity,
  FiHeart,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { authApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { validateLoginForm } from "../utils/validators.js";

const initialValues = { identifier: "", password: "", remember: true };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

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
      });
      login(data.token, data);
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

  // Cột trái theo Ảnh 1
  const leftPanelContent = (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider">
        HỆ SINH THÁI Y TẾ IOT THẾ HỆ MỚI
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Bảo vệ người cao tuổi <br />
        <span className="text-blue-600">với Camera AI & Device thông minh</span>
      </h1>

      <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl">
        Giám sát phát hiện té ngã liên tục 24/7 với trí tuệ nhân tạo đa tầng,
        bảo vệ quyền riêng tư tuyệt đối không xâm phạm hình ảnh nhạy cảm.
      </p>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <FiRadio className="text-blue-600 w-4 h-4" />
            <span>ĐA CẢM BIẾN</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">mmWave</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Device & AI Camera
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-red-500">
            <FiClock className="w-4 h-4" />
            <span>&lt; 25 GIÂY</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">Cấp Cứu</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Thời gian phản hồi tức thì
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-blue-600">
            <span className="text-blue-600 font-bold">*</span>
            <span>TRỰC TIẾP</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            Tổng Đài 115
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Điều phối cứu hộ tự động
          </div>
        </div>
      </div>

      {/* Live Video Telemetry Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 space-y-3 relative overflow-hidden">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Trạm Giám Sát Trung Tâm • Phòng 402
          </span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
            TÍN HIỆU THỰC
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-slate-100 h-52 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
            alt="Medical Monitoring Room"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5 shadow">
            <FiActivity className="w-4 h-4" /> Tư thế: Ổn định (98.4%)
          </div>

          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-2 shadow">
            <FiHeart className="w-4 h-4 text-red-500" />
            <span>
              <strong className="text-base font-black">74</strong> BPM
            </span>
          </div>

          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Không
            phát hiện chấn động bất thường
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium pt-1">
          <span>✓ Tiêu chuẩn HL7/FHIR Y Tế</span>
          <span>⚡ Đồng bộ đa điểm tức thì</span>
        </div>
      </div>
    </div>
  );

  return (
    <AuthShell leftContent={leftPanelContent}>
      {/* Icon Shield Đầu Card */}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
        <FiShield className="h-6 w-6" />
      </div>

      <h2 className="text-center text-2xl font-black text-slate-900">
        Đăng nhập SentinelCare
      </h2>
      <p className="mt-1 text-center text-xs text-slate-400">
        Hệ thống giám sát té ngã và cảnh báo y tế thời gian thực
      </p>

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
            className="font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0052cc] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
        >
          <span>Đăng nhập</span>
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
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Tài khoản Google Workspace Y Tế</span>
      </button>

      <p className="mt-6 text-center text-xs text-slate-500 font-medium">
        Chưa có tài khoản?{" "}
        <Link to="/dang-ky" className="font-bold text-blue-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>

      {/* Server Status Box ở đáy Card */}
      <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <div>
            <div className="font-bold text-slate-800">
              Máy chủ Telemetry & Cảnh báo 115
            </div>
            <div className="text-slate-400">Hoạt động bình thường</div>
          </div>
        </div>
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          99.98%
        </span>
      </div>
    </AuthShell>
  );
}
