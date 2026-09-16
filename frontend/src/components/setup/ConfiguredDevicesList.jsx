import React from "react";
import { FiVideo, FiRadio, FiShield } from "react-icons/fi";

export default function ConfiguredDevicesList({ devices = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            MẠNG LƯỚI HOẠT ĐỘNG
          </span>
          <h3 className="text-lg font-black text-slate-900">
            Thiết bị & Camera đã cấu hình sẵn sàng
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Cập nhật lúc: {new Date().toLocaleTimeString()} • Bảo vệ liên tục 24/7
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Mock Camera Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <FiVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Camera Phòng Khách (Tầng 1)
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  ID: CAM-AI-99428-VN • Gắn góc Tây Nam
                </p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
              Trực tuyến 100%
            </span>
          </div>

          <div className="relative rounded-lg overflow-hidden h-28 bg-slate-800">
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80"
              alt="Camera preview"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
              FPS: 24 • Đang quét nhận dạng ngã
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span>Độ bao phủ: 38m² mặt sàn</span>
            <span className="font-bold text-blue-600">
              AI Model: PoseNet-V4-Medical
            </span>
          </div>
        </div>

        {/* Mock Wearable Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <FiRadio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  FallGuard 3D Pro - Cổ tay trái
                </h4>
                <p className="text-[11px] text-slate-500">
                  Giám sát:{" "}
                  <strong className="text-slate-800">
                    Nguyễn Văn An (74 tuổi)
                  </strong>
                </p>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
              Pin 96% • BLE Sóng mạnh
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">
                Trạng thái nhịp tim đồng bộ
              </span>
              <strong className="text-slate-900 font-mono">
                72 BPM (Bình thường)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                Ngưỡng gia tốc kích hoạt SOS
              </span>
              <strong className="text-slate-900 font-mono">
                ≥ 2.8G + Tư thế nằm ngang &gt; 15s
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">S/N Phần cứng</span>
              <strong className="text-slate-900 font-mono">
                FG-2024-00123-PRO
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-bold">
            <FiShield className="w-3.5 h-3.5" />
            <span>Tự động rung cảnh báo trước khi gọi 115</span>
          </div>
        </div>
      </div>
    </div>
  );
}
