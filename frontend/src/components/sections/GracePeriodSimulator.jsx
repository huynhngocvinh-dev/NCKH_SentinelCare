import { useState, useEffect } from "react";
import {
  FiClock,
  FiCheckCircle,
  FiPhoneCall,
  FiRotateCcw,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { EDITORIAL_IMAGES } from "../../constants/editorialImages";

export default function GracePeriodSimulator() {
  const [countdown, setCountdown] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let interval = null;
    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isActive) {
      setIsActive(false);
      setStatus("triggered");
      toast.error(
        "CẢNH BÁO TỐI CAO: Hết 25s không có phản hồi! Đang chuyển tuyến Cấp độ 1 gọi cấp cứu 115."
      );
    }
    return () => clearInterval(interval);
  }, [isActive, countdown]);

  const handleStartSim = () => {
    setCountdown(25);
    setIsActive(true);
    setStatus("counting");
    toast.warn(
      "Đã giả lập tình huống Té Ngã. Chu kỳ đếm ngược Grace Period 25s bắt đầu!"
    );
  };

  const handleCancel = () => {
    setIsActive(false);
    setStatus("cancelled");
    toast.success("Đã hủy cảnh báo khẩn cấp. Trạng thái người dùng an toàn.");
  };

  const handleEmergencyTrigger = () => {
    setIsActive(false);
    setCountdown(0);
    setStatus("triggered");
    toast.error(
      "Đã bấm Gọi Cấp Cứu Ngay Lập Tức! Tổng đài y tế 115 đang được kết nối."
    );
  };

  return (
    <section
      id="grace-period"
      className="mx-3 sm:mx-5 py-24 rounded-[34px] relative overflow-hidden text-white bg-[#06214b] shadow-[0_30px_90px_rgba(4,31,70,0.24)]"
    >
      {/* Parallax Background */}
      <div className="absolute inset-0">
        <img
          src={EDITORIAL_IMAGES.hall}
          alt=""
          className="w-full h-full object-cover grayscale opacity-35 tech-parallax-img"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(2, 24, 58, 0.96), rgba(4, 51, 108, 0.72)), linear-gradient(0deg, rgba(3, 27, 60, 0.8), transparent)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10">
        <p className="text-[10px] tracking-[2.2px] uppercase text-[#86dff4] font-semibold mb-12 reveal">
          03 — CƠ CHẾ CHỐNG BÁO ĐỘNG GIẢ 25 GIÂY (GRACE PERIOD)
        </p>

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 reveal">
            <h2 className="font-editorial text-4xl sm:text-6xl leading-[1.03] tracking-[-1.5px]">
              Nhìn thấy rủi ro.
              <br />
              <em className="text-[#8de6f7] italic">Không gây phiền nhiễu.</em>
            </h2>
            <p className="text-sm text-white/80 leading-relaxed max-w-lg">
              “Hội chứng mệt mỏi vì còi báo động” (Alarm Fatigue) khiến người
              cao tuổi tháo rời thiết bị. Thuật toán SentinelCare kết hợp bộ lọc
              động học và chu kỳ xác minh 25 giây để triệt tiêu báo giả.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md">
                <h3 className="font-bold text-sm text-[#8de6f7]">
                  Bộ Lọc Động Học Hàng Ngày
                </h3>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                  Phân biệt chính xác giữa ngồi phịch xuống ghế sofa êm, cúi
                  nhặt đồ hay tập dưỡng sinh với một cú ngã tự do mất kiểm soát.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-md">
                <h3 className="font-bold text-sm text-[#72f1ce]">
                  Tự Hủy Cảnh Báo Thông Minh
                </h3>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                  Nếu người dùng chỉ vấp nhẹ và tự đứng dậy di chuyển trong 10
                  giây, hệ thống tự hạ mức ưu tiên mà không làm phiền người
                  thân.
                </p>
              </div>
            </div>

            {/* 3 Metrics Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <b className="font-editorial text-3xl sm:text-4xl text-[#92eafb] font-normal">
                  99.4<small className="text-base">%</small>
                </b>
                <span className="block text-[9px] tracking-[1.4px] uppercase text-white/60 mt-1">
                  ĐỘ CHÍNH XÁC AI
                </span>
              </div>
              <div>
                <b className="font-editorial text-3xl sm:text-4xl text-[#92eafb] font-normal">
                  &lt; 1.2<small className="text-base">s</small>
                </b>
                <span className="block text-[9px] tracking-[1.4px] uppercase text-white/60 mt-1">
                  PHẢN HỒI SỰ CỐ
                </span>
              </div>
              <div>
                <b className="font-editorial text-3xl sm:text-4xl text-[#92eafb] font-normal">
                  25<small className="text-base">s</small>
                </b>
                <span className="block text-[9px] tracking-[1.4px] uppercase text-white/60 mt-1">
                  CHU KỲ XÁC MINH
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Countdown Widget */}
          <div className="lg:col-span-6 reveal delay-1">
            <div className="rounded-[28px] p-7 sm:p-9 bg-[#041634]/80 border border-white/20 backdrop-blur-xl shadow-2xl text-center space-y-6">
              <div className="flex justify-between items-center border-b border-white/15 pb-4">
                <span className="text-[11px] font-mono text-[#8de6f7] flex items-center gap-2">
                  <FiClock className="w-4 h-4" /> CHU KỲ XÁC MINH CỨU HỘ 25S
                </span>
                <span className="bg-white/10 text-sky-200 text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wider">
                  LIVE SIMULATOR
                </span>
              </div>

              {/* Circular Countdown Gauge */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-white/10"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="10"
                    className={`${
                      status === "triggered"
                        ? "text-rose-500"
                        : status === "cancelled"
                        ? "text-[#72f1ce]"
                        : "text-[#62d8f0]"
                    } transition-all duration-1000`}
                    fill="transparent"
                    strokeDasharray={477}
                    strokeDashoffset={477 - (477 * countdown) / 25}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono">
                    {countdown}s
                  </span>
                  <span className="text-[10px] tracking-[1.4px] text-white/60 uppercase mt-1">
                    THỜI GIAN CHỜ
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  Vòng Đang Rung Nhẹ &amp; Loa Cục Bộ Đang Hỏi:
                </h4>
                <p className="text-xs sm:text-sm text-sky-200/80 mt-1.5 italic">
                  “Bác ơi, Bác có ổn không? Hãy chạm vào màn hình hoặc bấm nút
                  trên vòng nếu không cần trợ giúp.”
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
                {status === "idle" ? (
                  <button
                    onClick={handleStartSim}
                    className="w-full bg-gradient-to-r from-[#0c4eaa] to-[#1687df] hover:brightness-110 text-white font-bold text-xs tracking-wider uppercase py-4 px-6 rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Kích Hoạt Giả Lập Cú Ngã (Thử Nghiệm)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      TÔI ỔN (Hủy Cảnh Báo)
                    </button>
                    <button
                      onClick={handleEmergencyTrigger}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiPhoneCall className="w-4 h-4" />
                      SOS GỌI CẤP CỨU NGAY
                    </button>
                  </>
                )}
              </div>

              {status !== "idle" && (
                <button
                  onClick={() => {
                    setIsActive(false);
                    setCountdown(25);
                    setStatus("idle");
                  }}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" /> Đặt lại mô phỏng ban
                  đầu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
