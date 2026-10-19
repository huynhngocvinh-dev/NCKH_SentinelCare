import React from "react";
import {
  FiPhone,
  FiMessageSquare,
  FiArrowUp,
  FiArrowDown,
  FiTrash2,
} from "react-icons/fi";

export default function RelativeList({ relatives = [], onMove, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-lg font-black text-slate-900">
          Danh Sách Thứ Tự Ưu Tiên
        </h3>
        <p className="text-xs text-slate-400">
          Hệ thống gọi từ người số 1 đến người cuối cùng. Dùng mũi tên để đổi
          thứ tự ưu tiên.
        </p>
      </div>

      <div className="space-y-3">
        {relatives.map((rel, index) => (
          <div
            key={rel.id}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 shrink-0 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                {rel.priorityOrder ?? index + 1}
              </span>
              <div className="w-11 h-11 shrink-0 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {(rel.contactName || "?").charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">
                    {rel.contactName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    {rel.relationship || "Người thân"}
                  </span>
                  {rel.accountOwner && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Chủ tài khoản
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                  📞 {rel.phoneNumber} • ✉️ {rel.email || "Chưa có email"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                title="Tăng ưu tiên"
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <FiArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Giảm ưu tiên"
                disabled={index === relatives.length - 1}
                onClick={() => onMove(index, 1)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <FiArrowDown className="w-4 h-4" />
              </button>
              <a
                href={`tel:${rel.phoneNumber}`}
                title="Gọi ngay"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center"
              >
                <FiPhone className="w-4 h-4" />
              </a>
              <a
                href={`sms:${rel.phoneNumber}`}
                title="Gửi tin nhắn SMS"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center"
              >
                <FiMessageSquare className="w-4 h-4" />
              </a>
              {!rel.accountOwner && (
                <button
                  type="button"
                  title="Xóa khỏi danh sách"
                  onClick={() => onDelete(rel)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center cursor-pointer"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
