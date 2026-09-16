import { useState, useEffect } from "react";
import {
  FiClock,
  FiCheckCircle,
  FiPhoneCall,
  FiRotateCcw,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function GracePeriodSimulator() {
  const [countdown, setCountdown] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'counting' | 'cancelled' | 'triggered'

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
      className="py-16 bg-white border-y border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            TRỌNG TÂM KHOA HỌC 02
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            Cơ Chế Chống Báo Động Giả Đa Tầng 25 Giây (Grace Period)
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            "Hội chứng mệt mỏi vì còi báo động" (Alarm Fatigue) là lý do hàng
            đầu khiến người cao tuổi tháo rời thiết bị. Thuật toán SentinelCare
            giải quyết triệt để vấn đề này.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Information Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Bộ Lọc Động Học Hàng Ngày
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Phân biệt chính xác giữa một cú nhảy ngồi phịch xuống ghế sofa
                êm, việc cúi gập người nhặt chìa khóa hay tập dưỡng sinh với một
                cú ngã tự do mất kiểm soát.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Tự Hủy Cảnh Báo Thông Minh
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Nếu người già chỉ bị vấp nhẹ và có thể tự đứng dậy tiếp tục di
                chuyển trong 10 giây, thuật toán suy diễn chuyển động sẽ tự động
                hạ mức ưu tiên mà không làm phiền người giám hộ.
              </p>
            </div>
          </div>

          {/* Live Simulator Widget */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 text-center space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-blue-400 flex items-center gap-2">
                  <FiClock className="w-4 h-4" /> CHU KỲ XÁC MINH CỨU HỘ 25 GIÂY
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-bold">
                  CHỐNG BÁO ĐỘNG SAI
                </span>
              </div>

              {/* Countdown Gauge */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="currentColor"
                    strokeWidth="12"
                    className={`${
                      status === "triggered"
                        ? "text-red-500"
                        : status === "cancelled"
                        ? "text-emerald-500"
                        : "text-blue-500"
                    } transition-all duration-1000`}
                    fill="transparent"
                    strokeDasharray={477}
                    strokeDashoffset={477 - (477 * countdown) / 25}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black font-mono">
                    {countdown}s
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase mt-1">
                    THỜI GIAN CHỜ
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold">
                  Vòng Đang Rung Nhẹ & Loa Cục Bộ Đang Hỏi:
                </h4>
                <p className="text-sm text-slate-400 mt-1 italic">
                  "Bác ơi, Bác có ổn không? Hãy chạm vào màn hình hoặc bấm nút
                  trên vòng nếu không cần trợ giúp."
                </p>
              </div>

              {/* Interactive Action Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                {status === "idle" ? (
                  <button
                    onClick={handleStartSim}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Kích Hoạt Giả Lập Cú Ngã (Thử Nghiệm)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      TÔI ỔN (Hủy Cảnh Báo)
                    </button>
                    <button
                      onClick={handleEmergencyTrigger}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiPhoneCall className="w-5 h-5" />
                      SOS GỌI CẤP CỨU NGAY LẬP TỨC
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
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mx-auto mt-2 cursor-pointer"
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
