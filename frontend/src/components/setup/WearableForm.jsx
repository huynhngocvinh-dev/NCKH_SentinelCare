import {
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
} from "react-icons/fi";

const WEAR_POSITIONS = [
  { key: "LEFT_WRIST", label: "Cổ tay trái", sub: "Đeo dạng đồng hồ" },
  { key: "RIGHT_WRIST", label: "Cổ tay phải", sub: "Tay thuận hoạt động" },
  { key: "NECKLACE", label: "Mặt dây chuyền", sub: "Đeo trước ngực" },
];

export default function WearableForm({
  formData,
  errors,
  onChange,
  onScanBluetooth,
  isScanning,
  onSubmit,
  submitting,
  onReset,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5"
    >
      <div>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          HỒ SƠ CẢM BIẾN CÁ NHÂN
        </span>
        <h3 className="text-xl font-black text-slate-900 mt-0.5">
          Đăng ký Thiết bị Đeo IoT Khẩn cấp
        </h3>
        <p className="text-xs text-slate-500">
          Ghép nối đồng hồ / mặt dây chuyền tích hợp cảm biến đo lực va chạm
          G-Force và định vị trong nhà.
        </p>
      </div>

      {/* 1. Mã Serial */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          1. Mã Serial Thiết bị (Serial Number / S/N) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.serialNumber}
            onChange={(e) => onChange("serialNumber", e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          />
          <button
            type="button"
            onClick={onScanBluetooth}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiRefreshCw
              className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`}
            />
            <span>Dò Tìm Thiết Bị Bluetooth</span>
          </button>
        </div>
        {errors.serialNumber && (
          <p className="text-xs text-red-500 mt-1">{errors.serialNumber}</p>
        )}
      </div>

      {/* 2. Khai báo thông tin Người được Giám sát */}
      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
        <label className="block text-xs font-bold text-blue-900">
          2. Khai báo thông tin Người được Giám sát *
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-1">
              Họ và tên *
            </span>
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Vd: Nguyễn Văn An"
                value={formData.subjectFullName}
                onChange={(e) => onChange("subjectFullName", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
            {errors.subjectFullName && (
              <p className="text-[10px] text-red-500 mt-0.5">
                {errors.subjectFullName}
              </p>
            )}
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-1">
              Giới tính *
            </span>
            <select
              value={formData.subjectGender}
              onChange={(e) => onChange("subjectGender", e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-1">
              Ngày tháng năm sinh *
            </span>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="date" 
                value={formData.subjectDob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => onChange("subjectDob", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
            {errors.subjectDob && (
              <p className="text-[10px] text-red-500 mt-0.5">
                {errors.subjectDob}
              </p>
            )}
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-600 mb-1">
              Tiền sử bệnh lý
            </span>
            <div className="relative">
              <FiActivity className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Vd: Ca huyết áp, tiền sử đột quỵ..."
                value={formData.medicalHistory}
                onChange={(e) => onChange("medicalHistory", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic pt-1">
          🩺 <strong>Giải thích y khoa:</strong> Thông tin sinh hiệu và tiền sử
          bệnh lý giúp AI cá nhân hóa ngưỡng cảnh báo té ngã và hỗ trợ lực lượng
          cứu hộ 115 khi xảy ra sự cố.
        </p>
      </div>

      {/* 3. Vị trí đeo thiết bị thực tế */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          3. Vị trí đeo thiết bị thực tế *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {WEAR_POSITIONS.map((pos) => (
            <button
              key={pos.key}
              type="button"
              onClick={() => onChange("wearPosition", pos.key)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                formData.wearPosition === pos.key
                  ? "bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="font-bold text-xs">{pos.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{pos.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>Xác nhận Ghép đôi Thiết bị Đeo</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-3 cursor-pointer"
        >
          Dò lại thiết bị khác
        </button>
      </div>
    </form>
  );
}
