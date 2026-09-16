import React from "react";
import {
  FiPlay,
  FiFileText,
  FiCheckCircle,
  FiRadio,
  FiCpu,
  FiActivity,
  FiShield,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function HeroSection() {
  const handleNotice = (msg) => {
    toast.info(msg);
  };

  return (
    <section
      id="giai-phap"
      className="pt-8 pb-16 bg-gradient-to-b from-slate-50 via-blue-50/30 to-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Research Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          ĐỀ TÀI NGHIÊN CỨU & ỨNG DỤNG LÂM SÀNG • MULTIMODAL AI
          TELEREHABILITATION
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Key Metrics */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Giải Pháp Giám Sát & Phản Ứng Té Ngã Toàn Diện Bằng{" "}
              <span className="text-blue-600">Trí Tuệ Nhân Tạo Đa Luồng</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Đột phá kết hợp Cảm biến chuyển động gia tốc 3D IoT (đeo tay/mặt
              dây) song song cùng Mạng lưới Camera Thị giác máy tính (AI Pose
              Estimation), triệt tiêu điểm mù và tối ưu hóa thời gian vàng cứu
              hộ người cao tuổi.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-3xl font-black text-blue-600">99.4%</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">
                  Độ chính xác AI
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-3xl font-black text-emerald-600">
                  &lt; 1.2s
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">
                  Phản hồi sự cố
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-3xl font-black text-indigo-600">0</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">
                  Báo giả phiền hà
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-3xl font-black text-rose-600">24/7</div>
                <div className="text-xs font-bold text-slate-500 uppercase mt-1">
                  Kết nối trạm 115
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#demo-live"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <FiPlay className="w-5 h-5 fill-current" />
                Xem Trực Quan Hệ Thống (Live Demo)
              </a>
              <a
                href="#dang-ky-tu-van"
                className="flex items-center gap-2 bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold px-7 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                <FiFileText className="w-5 h-5" />
                Đăng Ký Giải Pháp Ngay
              </a>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-500 font-semibold pt-2">
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Nghiên
                cứu độc quyền tại Việt Nam
              </span>
              <span className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Quyền
                riêng tư chuẩn Edge-Privacy
              </span>
            </div>
          </div>

          {/* Right Column: Real-time Live Telemetry Simulation Panel */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/20">
                TRẠNG THÁI: BÌNH THƯỜNG
              </div>

              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  MÔ PHỎNG GIÁM SÁT THỜI GIAN THỰC
                </h3>
                <p className="text-xs text-slate-400">
                  Phòng Độc Thân Cụ Bà Trần Thị Mùi (78 tuổi) • Phòng 302
                </p>
              </div>

              {/* Stream 1 */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-blue-400">
                  <span className="flex items-center gap-1.5">
                    <FiRadio className="w-4 h-4" /> LUỒNG 1: THIẾT BỊ ĐEO IOT
                  </span>
                  <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800 text-[10px]">
                    100Hz IMU
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">
                    Gia tốc chấn động (G-Force):
                  </div>
                  <div className="font-mono text-right font-bold text-emerald-400">
                    0.98 G (Ổn định)
                  </div>
                  <div className="text-slate-400">
                    Góc nghiêng (Pitch/Roll):
                  </div>
                  <div className="font-mono text-right font-bold text-emerald-400">
                    12° / 4° (Đứng thẳng)
                  </div>
                  <div className="text-slate-400">Nhịp tim thực tế:</div>
                  <div className="font-mono text-right font-bold text-blue-400">
                    74 BPM
                  </div>
                  <div className="text-slate-400">Phát hiện va đập sàn:</div>
                  <div className="font-mono text-right font-bold text-emerald-400">
                    ÂM TÍNH (0.02G)
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/40 flex justify-between">
                  <span>Dung lượng pin 86%</span>
                  <span className="text-emerald-400">
                    Kết nối eSIM 4G Active
                  </span>
                </div>
              </div>

              {/* Stream 2 */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <FiCpu className="w-4 h-4" /> LUỒNG 2: VISION EDGE AI
                  </span>
                  <span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-800 text-[10px]">
                    17 Skeletons
                  </span>
                </div>

                <div className="relative bg-slate-950 h-32 rounded-xl flex items-center justify-center border border-slate-800 overflow-hidden">
                  <div className="text-center space-y-1">
                    <FiActivity className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
                    <span className="text-xs font-mono text-emerald-400 block font-bold">
                      TƯ THẾ: ĐI BỘ BÌNH THƯỜNG
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 font-mono">
                    FPS: 30 | NPU Load: 24%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">Vị trí trắc lượng:</div>
                  <div className="font-mono text-right text-slate-200">
                    Khu vực Phòng khách (Vùng A2)
                  </div>
                  <div className="text-slate-400">Tỷ lệ khung xương ngã:</div>
                  <div className="font-mono text-right font-bold text-emerald-400">
                    0.03 / 1.00 (An toàn)
                  </div>
                </div>
              </div>

              {/* Cross-Validation Status */}
              <div className="bg-blue-950/60 border border-blue-800/80 rounded-xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-bold text-white">
                      Multimodal Neural Engine v4.2
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Đối soát tin hiệu chéo giữa Thiết bị đeo IoT & Mắt thần AI
                    </div>
                  </div>
                </div>
                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold text-[11px]">
                  ĐỒNG THUẬN 100%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
