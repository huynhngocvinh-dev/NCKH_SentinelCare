import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiArrowRight,
  FiShield,
  FiRadio,
  FiActivity,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import AuthShell from "../components/AuthShell.jsx";
import FormField from "../components/FormField.jsx";
import { authApi } from "../services/api.js";
import { validateRegisterForm } from "../utils/validators.js";

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

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // 1. Kiểm tra lỗi validate form
    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin trong biểu mẫu.");
      return;
    }

    setSubmitting(true);

    try {
      // 2. Thử gọi API Register nếu có Backend
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
      // Nếu có lỗi từ Backend (như trùng Email/SĐT), hiển thị thông báo
      const message = err.response?.data?.message || err.message || "Đăng ký không thành công.";
      toast.error(message);
      if (err.response?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Cột trái chuẩn giao diện y tế (Ảnh 2)
  const leftPanelContent = (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        HỆ THỐNG Y TẾ THẾ HỆ MỚI • v4.8 Clinical AI
      </div>

      <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
        Bảo vệ & Giám sát{" "}
        <span className="text-blue-600 underline decoration-blue-200">
          An toàn Toàn diện
        </span>{" "}
        <br />
        Cho Người Thân Yêu
      </h1>

      <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
        Hạ tầng thị giác máy tính và cảm biến radar mmWave độc quyền. Phát hiện
        té ngã ngay lập tức, tự động kích hoạt đàm thoại 2 chiều và báo động đội
        cứu hộ trong vòng 30 giây.
      </p>

      {/* Image & Radar Card Combo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative rounded-2xl overflow-hidden shadow-md h-56 border border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1581579438747-1dc8d1e05dd6?auto=format&fit=crop&w=600&q=80"
            alt="Elderly Care"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Cảm biến mmWave
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3 text-white">
            <div className="font-bold text-xs">Không cần camera ghi hình</div>
            <div className="text-[10px] text-slate-300">
              Bảo vệ quyền riêng tư tuyệt đối tại phòng tắm
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <FiRadio className="w-4 h-4" /> RADAR TELEMETRY
            </span>
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
              Trực tuyến
            </span>
          </div>

          <div className="my-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              ĐỘ TIN CẬY TƯ THẾ AI
            </div>
            <div className="text-3xl font-black text-blue-600">99.4%</div>
            {/* SVG Wave */}
            <svg className="w-full h-8 text-blue-500 mt-1" viewBox="0 0 100 25">
              <path
                d="M0 15 Q25 5 50 15 T100 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>⏱ Thời gian phản hồi</span>
              <strong className="text-slate-800">&lt; 1.2 Giây</strong>
            </div>
            <div className="flex justify-between">
              <span>🛡 Phối hợp trung tâm</span>
              <strong className="text-slate-800">Cấp cứu 115 / Gia đình</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 Features */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FiActivity className="w-5 h-5 text-blue-600 shrink-0" />
          <span>AI Fall Detection</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FiShield className="w-5 h-5 text-blue-600 shrink-0" />
          <span>24/7 Telecare</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FiRadio className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Multimodal IoT</span>
        </div>
      </div>
    </div>
  );

  return (
    <AuthShell leftContent={leftPanelContent}>
      <div className="text-xs font-bold text-blue-600 tracking-wider uppercase flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        KHỞI TẠO TRẠM GIÁM SÁT
      </div>

      <h2 className="text-2xl font-black text-slate-900">Tạo tài khoản mới</h2>
      <p className="mt-1 text-xs text-slate-400">
        Bắt đầu thiết lập hệ thống giám sát và bảo vệ khẩn cấp cho người thân
        của bạn.
      </p>

      <form className="mt-6 space-y-3.5" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Họ và tên người quản lý / chủ tài khoản *"
          name="fullName"
          icon={FiUser}
          value={values.fullName}
          onChange={handleChange}
          error={errors.fullName}
          placeholder="Ví dụ: Nguyễn Văn An"
        />

        {/* Input Số điện thoại có +84 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Số điện thoại liên hệ (Nhận cảnh báo SOS) *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 flex items-center gap-1 border border-slate-200">
              🇻🇳 +84
            </span>
            <input
              type="tel"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              placeholder="912 345 678"
              className={`w-full pl-24 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-600 ${
                errors.phone ? "border-red-400" : "border-slate-200"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

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

        <FormField
          label="Mật khẩu quản trị *"
          name="password"
          type="password"
          icon={FiLock}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Tối thiểu 8 ký tự, gồm số & ký tự đặc biệt"
        />

        <FormField
          label="Xác nhận lại mật khẩu *"
          name="confirmPassword"
          type="password"
          icon={FiLock}
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Nhập lại chính xác mật khẩu trên"
        />

        <div>
          <label className="flex items-start gap-2 text-[11px] text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={values.agreeTerms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Tôi đồng ý với{" "}
              <a
                href="#terms"
                className="text-blue-600 font-bold hover:underline"
              >
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="#privacy"
                className="text-blue-600 font-bold hover:underline"
              >
                Chính sách bảo mật y tế HIPAA
              </a>{" "}
              dành cho dữ liệu sức khoẻ người cao tuổi.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0052cc] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70"
        >
          <span>Đăng ký & Nhận mã xác thực OTP</span>
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
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <FcGoogle className="w-4 h-4" />
        <span>Tiếp tục với Google Workspace</span>
      </button>

      <p className="mt-5 text-center text-xs text-slate-500 font-medium">
        Đã có tài khoản SentinelCare?{" "}
        <Link
          to="/dang-nhap"
          className="font-bold text-blue-600 hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
        <FiShield className="w-3.5 h-3.5 text-blue-600" />
        <span>MÃ HÓA AES-256 & CHUẨN BẢO VỆ DỮ LIỆU SỨC KHỎE QUỐC TẾ</span>
      </div>
    </AuthShell>
  );
}