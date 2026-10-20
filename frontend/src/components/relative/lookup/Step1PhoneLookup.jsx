import React from "react";
import { FiSearch } from "react-icons/fi";

export default function Step1PhoneLookup({
  phoneNumber,
  setPhoneNumber,
  onLookup,
  searching,
  phoneError,
  setPhoneError,
}) {
  return (
    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
          1
        </span>
        <span>Bước 1: Nhập Số Điện Thoại Người Thân *</span>
        <span className="text-slate-400 font-normal ml-auto text-[11px]">
          Đầu số Việt Nam (+84)
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            placeholder="VD: 0987654321 hoặc +84987654321"
            className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none ${
              phoneError
                ? "border-red-500 focus:border-red-600"
                : "border-slate-200 focus:border-blue-600"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={onLookup}
          disabled={searching}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <FiSearch className="w-4 h-4" />
          <span>{searching ? "Đang tra..." : "Tra cứu"}</span>
        </button>
      </div>
      {phoneError && (
        <p className="text-xs text-red-500 font-medium">{phoneError}</p>
      )}
    </div>
  );
}
