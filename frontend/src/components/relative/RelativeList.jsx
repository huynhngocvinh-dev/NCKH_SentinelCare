import React from "react";
import {
  FiPhone,
  FiMessageSquare,
  FiMoreVertical,
  FiMove,
} from "react-icons/fi";

export default function RelativeList({ relatives = [], onCall, onSms }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Danh Sách Thứ Tự Ưu Tiên Leo Thang
          </h3>
          <p className="text-xs text-slate-400">
            Tự động liên hệ từ người số 1 đến số cuối cùng theo thời gian cấu
            hình
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <FiMove className="w-3.5 h-3.5" />
          <span>Kéo thả để đổi thứ tự cứu hộ</span>
        </div>
      </div>

      <div className="space-y-3">
        {relatives.map((rel, index) => (
          <div
            key={rel.id || index}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-4"
          >
            {/* STT & Avatar */}
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                {index + 1}
              </span>
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {rel.name ? rel.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">
                    {rel.name}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rel.roleBadgeStyle || "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {rel.role}
                  </span>
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    ● {rel.statusText || "Đã nhận"}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  📞 {rel.phone} • ✉️ {rel.email}
                </div>

                <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
                  ⚡ Kênh: {rel.channelDesc}
                </div>
              </div>
            </div>

            {/* Nút hành động nhanh */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCall(rel.phone)}
                title="Gọi ngay"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <FiPhone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSms(rel.phone)}
                title="Gửi tin nhắn SMS"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <FiMessageSquare className="w-4 h-4" />
              </button>
              <button
                title="Tùy chọn khác"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
