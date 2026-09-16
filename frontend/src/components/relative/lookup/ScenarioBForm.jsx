import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

const isValidVietnamesePhone = (phoneStr) => {
  if (!phoneStr) return true;
  const cleanPhone = phoneStr.replace(/\s+/g, "");
  return /(^(0[3|5|7|8|9])+([0-9]{8})$)|(^\+84[3|5|7|8|9]+([0-9]{8})$)/.test(
    cleanPhone
  );
};

const isValidEmail = (emailStr) => {
  if (!emailStr) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
};

export default function ScenarioBForm({ initialPhone, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    activationPhone: initialPhone || "",
    relationship: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialPhone) {
      setFormData((prev) => ({ ...prev, activationPhone: initialPhone }));
    }
  }, [initialPhone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ và tên người nhận là bắt buộc!";
    }
    if (formData.email && !isValidEmail(formData.email.trim())) {
      newErrors.email = "Email không đúng định dạng!";
    }
    if (
      formData.activationPhone &&
      !isValidVietnamesePhone(formData.activationPhone.trim())
    ) {
      newErrors.activationPhone = "Số điện thoại không đúng định dạng!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng kiểm tra lại thông tin nhập trong biểu mẫu!");
      return;
    }

    const newRelative = {
      id: Date.now(),
      name: formData.fullName,
      role: formData.relationship || "Hàng xóm sao lưu",
      roleBadgeStyle: "bg-slate-200 text-slate-700",
      statusText: "Chưa nhận (SMS & Gọi)",
      phone: formData.activationPhone || initialPhone,
      email: formData.email || "chua_co_email@domain.com",
      channelDesc: "Cuộc gọi tự động AI & SMS báo động sau 90s",
    };

    onSubmitSuccess(newRelative);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">
            Số điện thoại ({initialPhone}) chưa có tài khoản trên ứng dụng.
          </strong>
          Vui lòng điền thêm Tên và Email để hệ thống tự động gửi cảnh báo khẩn
          cấp qua tin nhắn SMS và Email y tế.
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Họ và tên người thân / Người liên hệ phụ: *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => {
              setFormData({ ...formData, fullName: e.target.value });
              if (errors.fullName)
                setErrors({ ...errors, fullName: undefined });
            }}
            placeholder="Vd: Bác Minh (Hàng xóm phòng 205)"
            className={`w-full bg-white border rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none ${
              errors.fullName
                ? "border-red-400 focus:border-red-500"
                : "border-slate-200 focus:border-blue-600"
            }`}
          />
          {errors.fullName && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email nhận cảnh báo :{" "}
            <span className="text-slate-400 font-normal">(Tùy chọn)</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="email@gmail.com"
            className={`w-full bg-white border rounded-xl px-4 py-2 text-xs font-mono text-slate-800 focus:outline-none ${
              errors.email
                ? "border-red-400 focus:border-red-500"
                : "border-slate-200 focus:border-blue-600"
            }`}
          />
          {errors.email && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số điện thoại nhận SMS/Gọi:{" "}
              <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={formData.activationPhone}
              onChange={(e) => {
                setFormData({ ...formData, activationPhone: e.target.value });
                if (errors.activationPhone)
                  setErrors({ ...errors, activationPhone: undefined });
              }}
              placeholder="Nhập số điện thoại..."
              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none ${
                errors.activationPhone
                  ? "border-red-400 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-600"
              }`}
            />
            {errors.activationPhone && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                {errors.activationPhone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mối quan hệ / Vai trò:{" "}
              <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) =>
                setFormData({ ...formData, relationship: e.target.value })
              }
              placeholder="Vd: Hàng xóm, Con trai..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <FiSave className="w-4 h-4" />
        <span>Lưu & Thêm Người nhận cảnh báo</span>
      </button>
    </form>
  );
}
