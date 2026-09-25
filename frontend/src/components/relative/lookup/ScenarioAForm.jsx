import React, { useState } from "react";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function ScenarioAForm({
  phoneNumber,
  userData,
  onSubmitSuccess,
}) {
  const [escalationLevel, setEscalationLevel] = useState("2");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Payload chuẩn hóa
    const payload = {
      fullName:
        userData?.contactName || userData?.name || "Người thân SentinelCare",
      email: userData?.email || "user@sentinelcare.com",
      activationPhone: phoneNumber.replace(/\s+/g, ""),
      relationship: "Người nhận chính",
      priorityOrder: parseInt(escalationLevel, 10),
    };

    try {
      const res = await api.post("/emergency-contacts", payload);

      toast.success("Đã lưu Người nhận cảnh báo vào CSDL MySQL!");

      // Gọi callback để trang cha RelativeManagementPage tự động reload lại danh sách
      if (onSubmitSuccess) {
        onSubmitSuccess(res.data);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Lỗi khi lưu dữ liệu vào Backend!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Đã tìm thấy tài khoản đã đăng ký trong hệ sinh thái SentinelCare
        </span>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
            {userData?.contactName || userData?.name
              ? (userData?.contactName || userData?.name)
                  .charAt(0)
                  .toUpperCase()
              : "SC"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">
                {userData?.contactName ||
                  userData?.name ||
                  "Tài khoản SentinelCare"}
              </h4>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                Đã xác thực
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {userData?.email || "Chưa cập nhật email"}
            </p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
          🔔 Sẵn sàng nhận Push App & SMS
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
      >
        <FiUserPlus className="w-4 h-4" />
        <span>
          {submitting
            ? "Đang lưu..."
            : "+ Thêm Người nhận cảnh báo (Hoàn tất 1-chạm)"}
        </span>
      </button>
    </form>
  );
}
