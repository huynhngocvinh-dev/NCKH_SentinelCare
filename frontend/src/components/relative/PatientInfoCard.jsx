import { FiUser, FiSliders } from "react-icons/fi";
import { toast } from "react-toastify";

export default function PatientInfoCard() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      {/* Cột trái: Thông tin người được giám sát */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
          <FiUser className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Bố (Cụ Nguyễn Văn An)
            </h2>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
              74 tuổi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bình
              thường, an toàn
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-mono">
              Mã thiết bị: <strong>FG-2024-00123</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">
              Pin cảm biến: <strong className="text-emerald-600">78%</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
            <span>
              📡 Kết nối:{" "}
              <strong className="text-blue-600">Rất tốt (18ms)</strong>
            </span>
            <span>•</span>
            <span>
              📍 Vị trí: <strong>Phòng ngủ Tầng 2</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Cột giữa: Nút xem chi tiết */}
      <button
        onClick={() => toast.info("Đang mở bảng điều khiển cảm biến y tế...")}
        className="bg-blue-50/80 hover:bg-blue-100 text-blue-700 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 text-left transition-all cursor-pointer"
      >
        <FiSliders className="w-6 h-6 shrink-0" />
        <div>
          <div className="font-bold text-xs">Xem chi tiết</div>
          <div className="text-[11px] text-blue-600">thiết bị & cảm biến</div>
        </div>
      </button>

      {/* Cột phải: Thống kê nhanh */}
      <div className="flex items-center gap-6 border-l border-slate-100 pl-6 w-full md:w-auto justify-between md:justify-start">
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            NGƯỜI NHẬN
          </div>
          <div className="text-2xl font-black text-blue-600">
            04{" "}
            <span className="text-xs font-normal text-slate-500">
              thành viên
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            ✓ 100% kích hoạt
          </div>
        </div>

        <div className="text-center border-l border-slate-100 pl-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            KÊNH TRUYỀN
          </div>
          <div className="text-2xl font-black text-slate-900">
            03{" "}
            <span className="text-xs font-normal text-slate-500">
              kênh đồng bộ
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            App, SMS, Voice
          </div>
        </div>

        <div className="text-center border-l border-slate-100 pl-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            LEO THANG
          </div>
          <div className="text-2xl font-black text-red-600">
            25-90{" "}
            <span className="text-xs font-normal text-slate-500">giây</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            3 giai đoạn...
          </div>
        </div>
      </div>
    </div>
  );
}
