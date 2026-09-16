import React from "react";
import { FiDownload, FiBell, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";

export default function RelativeHeader() {
  const handleTestAlert = () => {
    toast.warn(
      "🔔 Đã bắn thử nghiệm tín hiệu báo động tới tất cả các kênh người thân!"
    );
  };

  const handleExportReport = () => {
    toast.info("📄 Đã xuất báo cáo sơ đồ leo thang khẩn cấp (PDF).");
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>TRUNG TÂM KIỂM SOÁT</span>
          <span>&gt;</span>
          <span className="text-blue-600">CẤU HÌNH CỨU HỘ KHẨN CẤP</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
          Quản lý Người Thân & Cấu hình Kênh Nhận Cảnh Báo Khẩn Cấp
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Hệ thống leo thang thông minh tự động đa tầng: App Push • Voice Bot AI
          • SMS Khẩn Cấp
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span>Giao thức Leo thang Tự động:</span>
          <span className="text-blue-800 font-black">KÍCH HOẠT</span>
        </div>

        <button
          onClick={handleExportReport}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FiDownload className="w-4 h-4" />
          <span>Xuất Báo Cáo Sơ Đồ</span>
        </button>

        <button
          onClick={handleTestAlert}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FiBell className="w-4 h-4" />
          <span>Bắn Thử Cảnh Báo (Test)</span>
        </button>
      </div>
    </div>
  );
}
