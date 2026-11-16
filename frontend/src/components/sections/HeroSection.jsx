import { useState, useEffect } from "react";
import {
  FiArrowRight,
  FiPlay,
  FiX,
  FiCheck,
  FiChevronDown,
} from "react-icons/fi";
import { EDITORIAL_IMAGES } from "../../constants/editorialImages";

export default function HeroSection() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    const onKeyDown = (e) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section
        id="giai-phap"
        className="relative h-[100svh] min-h-[760px] overflow-hidden bg-[#0a3470] text-white rounded-b-[34px]"
      >
        {/* Background Parallax Image */}
        <img
          src={EDITORIAL_IMAGES.hero}
          alt="Hệ thống Camera AI & Cảm biến SentinelCare trong không gian sống"
          className="w-full h-full object-cover hero-parallax-img"
        />

        {/* Deep Blue Layered Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(3, 25, 59, 0.94) 0%, rgba(5, 45, 98, 0.74) 38%, rgba(9, 58, 119, 0.18) 72%), linear-gradient(0deg, rgba(4, 27, 60, 0.75), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none hero-pointer-glow" />

        {/* Live Status Pill */}
        <div className="absolute top-28 left-6 sm:left-12 z-10 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/25 bg-[#083266]/45 backdrop-blur-md text-[10px] tracking-[1.7px] uppercase font-medium">
          <span className="w-1.5 h-1.5 rounded-full live-dot" />
          MULTIMODAL AI VISION — ONLINE
        </div>

        {/* Floating Glass Device Telemetry Widget */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute z-10 top-32 right-[5.5vw] w-[235px] p-4 rounded-[22px] border border-white/35 bg-[#f7fbff]/15 backdrop-blur-xl shadow-[0_24px_60px_rgba(2,29,66,0.28)] device-ui-float"
        >
          <div className="flex items-center justify-between text-[9px] tracking-[1.4px] uppercase font-semibold">
            <span>SENTINEL NODE 01</span>
            <span className="w-2 h-2 rounded-full bg-[#72f1ce] shadow-[0_0_12px_#72f1ce]" />
          </div>

          <div className="h-14 my-4 flex items-end gap-1.5 border-b border-white/20 pb-1">
            {[38, 66, 45, 84, 58, 94, 72, 86].map((h, idx) => (
              <span
                key={idx}
                style={{ height: `${h}%`, animationDelay: `${-idx * 0.35}s` }}
                className="w-full rounded-t bg-gradient-to-t from-[#3b91ef] to-[#70e2f7] data-bar"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-white/75 text-[11px]">Độ chính xác AI</span>
            <b className="text-[15px] text-[#89edff] font-bold">99.4%</b>
          </div>
          <div className="mt-2 pt-2 border-t border-white/15 flex justify-between text-[10px] text-white/70 font-mono">
            <span>IMU 100Hz</span>
            <span className="text-[#72f1ce]">17 Skeletons</span>
          </div>
        </div>

        {/* Main Editorial Hero Content */}
        <div className="absolute left-6 right-6 sm:left-12 sm:right-12 bottom-14 z-10 max-w-6xl reveal">
          <p className="text-[10px] sm:text-xs tracking-[2.8px] uppercase text-sky-200/90 mb-5 font-medium">
            SENTINELCARE • MULTIMODAL AI &amp; IOT TELEREHABILITATION
          </p>

          <h1 className="text-5xl sm:text-7xl lg:text-[102px] font-light tracking-[-3px] sm:tracking-[-4.5px] leading-[0.95]">
            Nhìn thấy rủi ro.
            <br />
            <em className="font-editorial italic font-normal text-[#a8eafb] tracking-[-2px]">
              Bảo vệ bằng trí tuệ.
            </em>
          </h1>

          <div className="mt-9 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <p className="text-xs sm:text-sm leading-relaxed text-white/75 max-w-md font-normal">
              Hợp nhất cảm biến gia tốc 3D IoT đeo tay và mạng lưới Camera Thị
              giác máy tính Edge AI — phát hiện té ngã dưới 1.2 giây, bảo vệ
              người cao tuổi 24/7.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={() => setModalOpen(true)}
                className="group inline-flex items-center gap-3.5 text-[11px] tracking-[1.2px] uppercase font-semibold text-white cursor-pointer"
              >
                <span className="w-12 h-12 rounded-full border border-white/60 grid place-items-center transition-all duration-300 group-hover:bg-white group-hover:text-[#071a36] group-hover:scale-105">
                  <FiPlay className="w-4 h-4 fill-current ml-0.5" />
                </span>
                Mô phỏng Edge AI
              </button>

              <button
                onClick={() => scrollTo("grace-period")}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-white text-[#071a36] text-xs font-bold tracking-wide hover:bg-sky-100 transition-all cursor-pointer shadow-lg"
              >
                Thử nghiệm 25s <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Down Cue */}
        <button
          onClick={() => scrollTo("thuc-trang")}
          aria-label="Cuộn xuống khám phá"
          className="hidden md:grid place-items-center absolute right-8 bottom-14 z-10 w-11 h-11 rounded-full border border-white/40 text-white hover:bg-white/15 transition animate-bounce cursor-pointer"
        >
          <FiChevronDown className="w-5 h-5" />
        </button>
      </section>

      {/* Modal Mô Phỏng Camera Edge AI */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#021430]/85 backdrop-blur-md grid place-items-center p-4 sm:p-6"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-[#f8fbff] rounded-[28px] overflow-hidden shadow-[0_40px_120px_rgba(0,15,42,0.5)] grid md:grid-cols-12 relative"
          >
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Đóng mô phỏng"
              className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full border border-white/40 bg-[#0c1b1c]/60 text-white grid place-items-center hover:bg-black transition cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="md:col-span-7 relative min-h-[340px] sm:min-h-[500px] overflow-hidden">
              <img
                src={EDITORIAL_IMAGES.room}
                alt="Mô phỏng Camera AI SentinelCare"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#08181d]/20" />
              <div className="scan-line absolute left-[5%] right-[5%] h-[2px] z-10" />

              {/* Bounding Box Frame */}
              <div className="absolute left-[30%] top-[24%] w-[40%] h-[55%] z-10">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#8ce8f4]" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#8ce8f4]" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#8ce8f4]" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#8ce8f4]" />
              </div>

              <div className="absolute left-5 bottom-5 z-10 px-3.5 py-2 rounded-full bg-[#081c20]/75 backdrop-blur-md text-white text-[10px] tracking-[1.2px] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9be0c3] animate-ping" />
                NPU Edge AI — Đang phân tích 17 khớp xương
              </div>
            </div>

            <div className="md:col-span-5 p-8 sm:p-12 flex flex-col justify-center text-[#071a36]">
              <span className="text-[10px] tracking-[2px] uppercase text-slate-500 font-bold">
                ZERO-FOOTPRINT EDGE PRIVACY
              </span>
              <h2 className="font-editorial text-4xl sm:text-5xl leading-[1.05] my-5">
                Phát hiện. Phân tích.
                <br />
                <em className="text-[#1469db]">Bảo vệ tức thì.</em>
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 mb-6">
                Hình ảnh quang học được vi xử lý NPU phân tích ngay tại thiết bị
                và hủy tức thì trong RAM. Chỉ tập tọa độ khung xương và cảnh báo
                rủi ro được truyền đi trong dưới 1.2 giây.
              </p>
              <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <FiCheck className="text-[#1469db] w-4 h-4" /> Độ chính xác
                  hợp nhất đa luồng 99.4%
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-[#1469db] w-4 h-4" /> Tự động kích
                  hoạt cuộc gọi thoại &amp; cấp cứu 115
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
