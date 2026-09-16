import React from "react";
import { FiShield } from "react-icons/fi";

export default function EscalationMechanism() {
  return (
    <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
        <FiShield className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-bold text-sm text-blue-950">
          Cơ chế hoạt động của mạng lưới khẩn cấp
        </h3>
        <p className="text-xs text-blue-800/80 leading-relaxed mt-1">
          Khi phát hiện sự cố té ngã bất thường, <strong>FallGuard AI</strong>{" "}
          lập tức kích hoạt chuỗi truyền tin tự động qua ứng dụng di động, cuộc
          gọi Voice Bot tương tác y tế và tin nhắn SMS định vị GPS chính xác đến
          từng người thân theo thứ tự ưu tiên bên dưới.
        </p>
      </div>
    </div>
  );
}
