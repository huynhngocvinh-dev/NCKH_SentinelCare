import {
  FiCheck,
  FiRadio,
  FiVideo,
  FiActivity,
  FiUserCheck,
  FiMapPin,
  FiLock,
} from "react-icons/fi";
import { EDITORIAL_IMAGES } from "../../constants/editorialImages";

export default function ArchitectureSection() {
  return (
    <section
      id="cong-nghe"
      className="py-28 relative"
      style={{
        background:
          "radial-gradient(circle at 85% 12%, rgba(93, 208, 242, 0.22), transparent 24%), #f5faff",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
        {/* Section Heading */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 reveal">
          <p className="lg:col-span-4 text-[10px] tracking-[2.2px] uppercase text-slate-500 font-semibold">
            02 — KIẾN TRÚC ĐA LUỒNG
          </p>
          <div className="lg:col-span-8">
            <h2 className="font-editorial text-5xl sm:text-7xl leading-[0.98] tracking-[-2px] text-[#071a36]">
              Một hệ thống.
              <br />
              <em className="text-[#1672df] italic">Triệt tiêu mọi điểm mù.</em>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-5 max-w-2xl leading-relaxed">
              Nguyên lý “Bù trừ điểm mù”: Thiết bị đeo IoT xác thực danh tính và
              quán tính 100Hz; Mắt thần Edge AI không gian xác thực khung xương
              17 điểm, loại bỏ 100% khiếm khuyết của hệ thống đơn phương thức.
            </p>
          </div>
        </div>

        {/* Sticky Editorial Feature (Stream B - Edge AI Vision) */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 relative h-[460px] sm:h-[600px] rounded-[30px] overflow-hidden shadow-[0_30px_80px_rgba(12,72,140,0.16)] group reveal">
            <img
              src={EDITORIAL_IMAGES.room}
              alt="Mạng lưới Camera Thị giác máy tính Edge AI"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000 group-hover:scale-100"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 55%, rgba(7, 17, 18, 0.45))",
              }}
            />

            {/* Corner Focus Frame */}
            <div className="absolute left-[30%] top-[26%] w-[40%] h-[52%] z-10">
              <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#a1e8f5]" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#a1e8f5]" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#a1e8f5]" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#a1e8f5]" />
            </div>

            <div className="absolute left-6 bottom-6 z-10 px-4 py-2 rounded-full border border-white/25 bg-[#07366f]/70 backdrop-blur-md text-white text-[10px] tracking-[1.4px] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9ce2c4]" />
              Zero-Footprint Video • Hủy khung hình ngay tại RAM
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 reveal delay-1">
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[2px] uppercase text-[#1469db] font-bold">
              <FiVideo className="w-4 h-4" /> STREAM B • KHÔNG GIAN &amp; BỐI
              CẢNH
            </div>
            <h3 className="font-editorial text-4xl sm:text-5xl text-[#0c366f] leading-[1.05]">
              Thị giác máy tính
              <br />
              Edge AI 17 khớp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mô hình học sâu lượng tử hóa chạy trực tiếp trên vi xử lý NPU
              biên. Tính toán góc nghiêng thân người và tốc độ hạ thấp tâm khối
              theo thời gian thực.
            </p>

            <ul className="py-5 border-y border-[#0d4384]/15 space-y-3.5 text-xs text-slate-700">
              <li className="flex items-start gap-3">
                <FiActivity className="w-4 h-4 text-[#1469db] mt-0.5 shrink-0" />
                <span>
                  <strong>AI Pose Estimation 17 khớp xương:</strong> Nhận diện
                  chính xác dáng ngã kể cả trong điều kiện thiếu sáng.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FiMapPin className="w-4 h-4 text-[#1469db] mt-0.5 shrink-0" />
                <span>
                  <strong>Định vị tọa độ từng phòng:</strong> Phân vùng “Cầu
                  thang tầng 1”, “Hành lang bếp” để cứu hộ tiếp cận thẳng mục
                  tiêu.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FiLock className="w-4 h-4 text-[#1469db] mt-0.5 shrink-0" />
                <span>
                  <strong>Bảo mật Zero-Footprint Video:</strong> Chỉ truyền đi
                  tập vector khớp xương, tôn trọng tuyệt đối quyền riêng tư.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom 2 Editorial Strip Cards (Stream A & Patient Binding) */}
        <div className="grid md:grid-cols-2 gap-5 mt-20">
          <article className="grid sm:grid-cols-12 rounded-[28px] overflow-hidden bg-white border border-[#125bae]/10 shadow-[0_22px_55px_rgba(13,74,143,0.08)] hover:-translate-y-2 transition-transform duration-500 reveal delay-1">
            <div className="sm:col-span-5 h-60 sm:h-auto overflow-hidden">
              <img
                src={EDITORIAL_IMAGES.chair}
                alt="Thiết bị đeo IoT IMU 6 trục"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-7 p-7 sm:p-8 flex flex-col justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[1.8px] uppercase text-[#1469db] font-bold">
                <FiRadio className="w-3.5 h-3.5" /> STREAM A • IMU 100HZ
              </span>
              <h3 className="font-editorial text-3xl text-[#071a36] my-3 leading-tight">
                Cảm biến quán tính 6 trục đeo tay
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ghi nhận liên tục vector gia tốc 3D (Ax, Ay, Az) và vận tốc góc
                (Gx, Gy, Gz) ở tần số 100Hz, phân tích dạng sóng va đập đỉnh và
                khoảng bất động tức thì.
              </p>
            </div>
          </article>

          <article className="grid sm:grid-cols-12 rounded-[28px] overflow-hidden bg-white border border-[#125bae]/10 shadow-[0_22px_55px_rgba(13,74,143,0.08)] hover:-translate-y-2 transition-transform duration-500 reveal delay-2">
            <div className="sm:col-span-5 h-60 sm:h-auto overflow-hidden">
              <img
                src={EDITORIAL_IMAGES.hall}
                alt="Định danh hồ sơ y bạ điện tử"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-7 p-7 sm:p-8 flex flex-col justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[1.8px] uppercase text-[#1469db] font-bold">
                <FiUserCheck className="w-3.5 h-3.5" /> PATIENT ID BINDING
              </span>
              <h3 className="font-editorial text-3xl text-[#071a36] my-3 leading-tight">
                Định danh đích danh &amp; Y bạ điện tử
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mỗi thiết bị gắn mã định danh duy nhất với hồ sơ bệnh lý (tiền
                sử tim mạch, huyết áp, nhóm máu), loại bỏ hoàn toàn nhầm lẫn khi
                trong phòng có nhiều người.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
