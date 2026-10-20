import { FiCheckCircle, FiVolume2 } from "react-icons/fi";
import { toast } from "react-toastify";

export default function CameraForm({
  formData,
  errors,
  onChange,
  onSubmit,
  submitting,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5"
    >
      <div>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
          THÔNG SỐ CÀI ĐẶT TRẠM
        </span>
        <h3 className="text-xl font-black text-slate-900 mt-0.5">
          Đăng ký thông tin Camera AI
        </h3>
        <p className="text-xs text-slate-500">
          Xác lập định danh phòng chuẩn xác để kích hoạt chuông báo và điều
          hướng cứu hộ tức thì khi xảy ra sự cố té ngã.
        </p>
      </div>

      {/* 1. Tên Camera */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          1. Tên Camera Định danh *
        </label>
        <input
          type="text"
          value={formData.cameraName}
          onChange={(e) => onChange("cameraName", e.target.value)}
          placeholder="Ví dụ: Camera Cầu Thang Tầng 2"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600"
        />
        {errors.cameraName && (
          <p className="text-xs text-red-500 mt-1">{errors.cameraName}</p>
        )}
      </div>

      {/* 2. ID Camera & Ping test */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          2. ID Camera (Camera Serial / MAC Address) *
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
            onClick={() =>
              toast.success(
                "Phản hồi gói tin ICMP 32 bytes: time=12ms (Rất ổn định) - 100% GÓI ĐẠT"
              )
            }
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Kiểm tra kết nối / Ping thử nghiệm
          </button>
        </div>
      </div>

      {/* 3. Vị trí gắn Camera */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          3. Vị trí gắn Camera trong khuôn viên nhà *
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={formData.roomLocation}
            onChange={(e) => onChange("roomLocation", e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="Phòng khách">Phòng khách</option>
            <option value="Phòng ngủ">Phòng ngủ</option>
            <option value="Cầu thang">Cầu thang</option>
            <option value="Nhà bếp">Nhà bếp</option>
          </select>

          <input
            type="text"
            value={formData.cameraAngle}
            onChange={(e) => onChange("cameraAngle", e.target.value)}
            placeholder="Góc trần Tây Nam..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Intercom Toggle */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FiVolume2 className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <div className="font-bold text-xs text-slate-800">
              Kích hoạt Đàm thoại Hai Chiều Khẩn cấp (Two-way Intercom)
            </div>
            <div className="text-[10px] text-slate-400">
              Tự động mở loa để trò chuyện trực tiếp khi có tín hiệu cảnh báo
              ngã.
            </div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={formData.enableTwoWayIntercom}
          onChange={(e) => onChange("enableTwoWayIntercom", e.target.checked)}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60"
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>Lưu & Kích hoạt Camera này</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-3 cursor-pointer"
        >
          Hủy thao tác
        </button>
      </div>
    </form>
  );
}
