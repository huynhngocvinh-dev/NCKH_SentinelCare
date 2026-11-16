import { FiClock, FiPhoneOff, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { EDITORIAL_IMAGES } from "../../constants/editorialImages";

export default function PainPointsSection() {
  const cards = [
    {
      index: "01",
      tag: "QUY TẮC 30 PHÚT VÀNG",
      title: "THỜI GIAN BẤT ĐỘNG",
      desc: "Người cao tuổi nằm bất động sau té ngã quá 30 phút làm tăng tỷ lệ tử vong lên 50% do hạ thân nhiệt, hoại tử cơ và tổn thương thần kinh.",
      source: "Geriatrics Journal",
      image: EDITORIAL_IMAGES.interior,
      icon: <FiClock className="w-4 h-4" />,
    },
    {
      index: "02",
      tag: "BẤT CẬP THIẾT BỊ ĐƠN LẺ",
      title: "68% THÁO VÒNG SOS",
      desc: "Vòng bấm nút đòi hỏi người ngã phải còn tỉnh táo; hơn 68% người cao tuổi tháo vòng khi ngủ hoặc tắm — lúc xác suất trượt ngã cao nhất.",
      source: "Rủi ro bất tỉnh",
      image: EDITORIAL_IMAGES.flowers,
      icon: <FiPhoneOff className="w-4 h-4" />,
    },
    {
      index: "03",
      tag: "ĐIỂM MÙ CAMERA ĐỘC LẬP",
      title: "KHU VỰC RIÊNG TƯ",
      desc: "Camera đơn lẻ bị che khuất bởi đồ vật, nhầm lẫn nhiều người và không thể lắp đặt trong nhà tắm hay phòng thay đồ.",
      source: "Bù trừ đa luồng",
      image: EDITORIAL_IMAGES.care,
      icon: <FiEyeOff className="w-4 h-4" />,
    },
  ];

  return (
    <section
      id="thuc-trang"
      className="py-28 text-white relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 30%, rgba(29, 121, 226, 0.34), transparent 28%), radial-gradient(circle at 88% 70%, rgba(61, 208, 236, 0.15), transparent 25%), #071b3b",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
        {/* Top Editorial Header */}
        <div className="grid lg:grid-cols-12 gap-8 items-start mb-16 reveal">
          <p className="lg:col-span-4 text-[10px] tracking-[2.2px] uppercase text-[#86dff4] font-semibold">
            01 — TÍNH CẤP THIẾT Y TẾ
          </p>
          <h2 className="lg:col-span-8 font-editorial text-4xl sm:text-5xl lg:text-[58px] leading-[1.12] tracking-[-1.2px]">
            Té ngã ở người cao tuổi: sự nguy hiểm nằm ở khoảng thời gian{" "}
            <em className="text-[#8de6f7] italic">bất động</em> không ai{" "}
            <em className="text-[#8de6f7] italic">phát hiện</em>.
          </h2>
        </div>

        {/* 3 Principle Image Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card, idx) => (
            <article
              key={card.index}
              className={`group relative h-[490px] rounded-[28px] overflow-hidden border border-white/15 shadow-[0_28px_70px_rgba(0,13,38,0.35)] reveal delay-${
                idx + 1
              }`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover saturate-75 contrast-105 transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(4,15,34,0.15) 20%, rgba(5,18,42,0.92) 100%)",
                }}
              />

              <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] tracking-[1.6px] uppercase text-sky-200">
                  {card.tag}
                </span>
                <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-[#8de6f7]">
                  {card.icon}
                </span>
              </div>

              <div className="absolute left-7 right-7 bottom-7">
                <span className="text-[10px] tracking-[2px] text-sky-300/80 font-mono">
                  {card.index} / {card.source}
                </span>
                <h3 className="font-editorial text-3xl tracking-[-0.5px] mt-2 mb-3 text-white">
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/75">
                  {card.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Editorial Note */}
        <div className="mt-14 pt-8 border-t border-white/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 reveal">
          <p className="font-editorial text-xl sm:text-2xl text-white/90 max-w-xl leading-snug">
            SentinelCare kiến tạo chuẩn mực chăm sóc mới, nơi công nghệ hiện
            diện thật khẽ nhưng bảo vệ trọn vẹn từng khoảnh khắc.
          </p>
          <a
            href="#cong-nghe"
            className="inline-flex items-center gap-4 pb-2 border-b border-white/50 text-[11px] tracking-[1.4px] uppercase text-white hover:text-[#8de6f7] hover:border-[#8de6f7] transition"
          >
            Kiến trúc đa luồng <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
