
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
      desc: "Rung phản hồi haptic trên cổ tay, còi chớp nhẹ trong phòng và bật mic đàm thoại hai chiều trực tiếp với cụ bà để xác nhận mức độ tỉnh táo.",
      target: "Đánh giá nhanh tại chỗ",
      icon: <FiVolume2 className="w-5 h-5 text-blue-600" />,
      color: "border-blue-200 bg-blue-50/50",
    },
    {
      level: "CẤP ĐỘ 1",
      time: "Sau 25 Giây",
      title: "App Push & SMS Khẩn",
      desc: "Bắn cảnh báo ưu tiên cấp bách (Critical Alert vượt qua chế độ im lặng) đến điện thoại Người giám hộ chính kèm bản đồ GPS và snapshot dáng ngã.",
      target: "Thông trí người nhà trực tiếp",
      icon: <FiBell className="w-5 h-5 text-indigo-600" />,
      color: "border-indigo-200 bg-indigo-50/50",
    },
    {
      level: "CẤP ĐỘ 2",
      time: "Sau 50 Giây",
      title: "Automated Voice Bot Call",
      desc: 'Tổng đài AI tự động thực hiện cuộc gọi thoại liên hoàn tới danh sách con cháu theo thứ tự ưu tiên: "Bác Mùi có nguy cơ ngã tại Cầu thang, vui lòng kiểm tra ngay!".',
      target: "Đánh thức phản xạ khẩn",
      icon: <FiPhoneCall className="w-5 h-5 text-amber-600" />,
      color: "border-amber-200 bg-amber-50/50",
    },
    {
      level: "CẤP ĐỘ 3",
      time: "Sau 90 Giây",
      title: "Điều Phối Y Tế 115 & Hàng Xóm",
      desc: "Tự động thông báo mạng lưới ứng cứu cộng đồng lân cận, chuyển hồ sơ bệnh lý và vị trí định vị đến Trạm y tế/Cấp cứu 115 gần nhất đề xuất xe cứu thương.",
      target: "Cấp cứu y tế sinh mệnh",
      icon: <FiAlertTriangle className="w-5 h-5 text-red-600" />,
      color: "border-red-200 bg-red-50/50",
    },
  ];

  return (
    <section id="phan-cap" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            TRỌNG TÂM KHOA HỌC 03
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            Quy Trình Leo Thang Cứu Hộ Phân Cấp Tự Động
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            Khi sự cố được xác định không thể tự khắc phục, hệ thống kích hoạt
            ma trận phản ứng nhanh theo thời gian chuẩn y khoa mà không cần con
            người tác động thủ công.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${step.color} shadow-sm space-y-4 bg-white`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {step.level}
                </span>
                <span className="text-xs font-bold font-mono text-blue-600">
                  {step.time}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                Mục tiêu: <span className="text-slate-800">{step.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
