import React from "react";

export default function HardwareStatusGrid() {
  return (
    <div className="pt-2 border-t border-slate-100">
      <span className="text-[11px] font-bold text-slate-400 uppercase">
        TÌNH TRẠNG KIỂM TRA CẢM BIẾN PHẦN CỨNG
      </span>
      <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
        <div className="bg-slate-50 p-2 rounded-lg border">
          <div className="text-[10px] text-slate-400">Đèn LED RGB</div>
          <div className="font-bold text-emerald-600 mt-0.5">● OK</div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border">
          <div className="text-[10px] text-slate-400">Nút SOS Khẩn</div>
          <div className="font-bold text-blue-600 mt-0.5">● Đã test</div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border">
          <div className="text-[10px] text-slate-400">Gia tốc 3D IMU</div>
          <div className="font-bold text-slate-800 mt-0.5">99.8%</div>
        </div>
      </div>
    </div>
  );
}
