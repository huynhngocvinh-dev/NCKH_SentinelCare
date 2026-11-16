import {
  FiVolume2,
  FiBell,
  FiPhoneCall,
  FiAlertTriangle,
} from "react-icons/fi";

export default function EscalationProcessSection() {
  const steps = [
    {
      level: "CẤP ĐỘ 0",
      time: "0s - 25s",
      title: "Báo Động & Loa Cục Bộ",
      desc: "Rung phản hồi haptic trên cổ tay, còi chớp nhẹ trong phòng và bật mic đàm thoại hai chiều trực tiếp để xác nhận mức độ tỉnh táo.",
      target: "Đánh giá nhanh tại chỗ",
      icon: <FiVolume2 className="w-5 h-5 text-[#1469db]" />,
    },
    {
      level: "CẤP ĐỘ 1",
      time: "Sau 25 Giây",
      title: "App Push & SMS Khẩn",
      desc: "Bắn cảnh báo ưu tiên cấp bách (Critical Alert vượt qua chế độ im lặng) đến điện thoại Người giám hộ chính kèm bản đồ GPS và snapshot dáng ngã.",
      target: "Thông trí người nhà trực tiếp",
      icon: <FiBell className="w-5 h-5 text-indigo-600" />,
    },
    {
      level: "CẤP ĐỘ 2",
      time: "Sau 50 Giây",
      title: "Automated Voice Bot Call",
      desc: 'Tổng đài AI tự động thực hiện cuộc gọi thoại liên hoàn tới danh sách con cháu theo thứ tự ưu tiên: "Bác Mùi có nguy cơ ngã tại Cầu thang, vui lòng kiểm tra ngay!".',
      target: "Đánh thức phản xạ khẩn",
      icon: <FiPhoneCall className="w-5 h-5 text-amber-600" />,
    },
    {
      level: "CẤP ĐỘ 3",
      time: "Sau 90 Giây",
      title: "Điều Phối Y Tế 115",
      desc: "Tự động thông báo mạng lưới ứng cứu cộng đồng lân cận, chuyển hồ sơ bệnh lý và vị trí định vị đến Trạm y tế / Cấp cứu 115 gần nhất.",
      target: "Cấp cứu y tế sinh mệnh",
      icon: <FiAlertTriangle className="w-5 h-5 text-rose-600" />,
    },
  ];

  return (
    <section id="phan-cap" className="py-24 bg-[#eaf3ff]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-12 gap-8 mb-14 reveal">
          <p className="lg:col-span-4 text-[10px] tracking-[2.2px] uppercase text-slate-600 font-semibold">
            04 — LEO THANG CỨU HỘ
          </p>
          <div className="lg:col-span-8">
            <h2 className="font-editorial text-4xl sm:text-6xl leading-[1.03] tracking-[-1.5px] text-[#071a36]">
              Quy trình phản ứng phân cấp{" "}
              <em className="text-[#1469db] italic">hoàn toàn tự động.</em>
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base max-w-2xl">
              Khi sự cố được xác định không thể tự khắc phục, hệ thống kích hoạt
              ma trận phản ứng nhanh theo thời gian chuẩn y khoa mà không cần
              tác động thủ công.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-[24px] bg-white border border-[#125bae]/12 shadow-[0_18px_45px_rgba(13,74,143,0.07)] hover:-translate-y-1.5 transition-all duration-300 space-y-4 reveal delay-${
                (idx % 3) + 1
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#eaf3ff] text-[#071a36]">
                  {step.level}
                </span>
                <span className="text-xs font-bold font-mono text-[#1469db]">
                  {step.time}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#f5faff] border border-blue-100 flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="font-bold text-[#071a36] text-base">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                Mục tiêu: <span className="text-[#071a36]">{step.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
