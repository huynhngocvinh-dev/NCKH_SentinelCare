import React, { useState } from "react";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";

export default function ScenarioAForm({ phoneNumber, onSubmitSuccess }) {
  const [escalationLevel, setEscalationLevel] = useState("2");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRelative = {
      id: Date.now(),
      name: "Anh Nam (Nguyễn Hải Nam)",
      role: "Người nhận chính",
      roleBadgeStyle: "bg-blue-100 text-blue-700",
      statusText: "Đã nhận",
      phone: phoneNumber,
      email: "nam@email.com",
      channelDesc: `Kích hoạt sau ${
        escalationLevel === "2" ? "25s" : "50s"
      } nếu cấp trên chưa phản hồi`,
    };
    onSubmitSuccess(newRelative);
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
          <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center">
            AN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">
                Anh Nam (Nguyễn Hải Nam)
              </h4>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                Tài khoản cá nhân
              </span>
            </div>
            <p className="text-xs text-slate-500">nam@email.com</p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
          🔔 Đang cài đặt app & Bật thông báo đẩy thời gian thực
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <FiUserPlus className="w-4 h-4" />
        <span>+ Thêm Người nhận cảnh báo</span>
      </button>
    </form>
  );
}
