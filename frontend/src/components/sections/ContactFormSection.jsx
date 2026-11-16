import { useState } from "react";
import { FiArrowRight, FiPhoneCall, FiShield } from "react-icons/fi";
import { toast } from "react-toastify";

export default function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "Gia đình có người cao tuổi sống riêng",
    note: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Vui lòng điền Họ tên và Số điện thoại!");
      return;
    }
    toast.success(
      "Đã gửi yêu cầu nhận giải pháp thành công! Chuyên gia y tế sẽ tư vấn cho bạn trong 24h."
    );
    setFormData({
      name: "",
      phone: "",
      type: "Gia đình có người cao tuổi sống riêng",
      note: "",
    });
  };

  return (
    <section
      id="dang-ky-tu-van"
      className="py-28 relative"
      style={{
        background:
          "radial-gradient(circle at 10% 80%, rgba(81, 204, 239, 0.2), transparent 26%), #ffffff",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 grid lg:grid-cols-12 gap-14 items-center">
        {/* Left Copy */}
        <div className="lg:col-span-6 space-y-6 reveal">
          <p className="text-[10px] tracking-[2.2px] uppercase text-[#1469db] font-bold">
            07 — HỢP TÁC &amp; TRIỂN KHAI LÂM SÀNG
          </p>
          <h2 className="font-editorial text-5xl sm:text-6xl leading-[1.02] text-[#071a36]">
            Bắt đầu một cuộc sống
            <br />
            <em className="text-[#1469db] italic">an tâm hơn.</em>
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            Sẵn sàng cung cấp tài liệu giải thuật, kết nối API hệ thống quản lý
            bệnh viện (HIS/EMR) và trang bị bộ thí điểm (Pilot kits) cho gia
            đình &amp; cơ sở y tế.
          </p>

          <div className="pt-4 border-t border-slate-200 max-w-sm">
            <span className="text-[10px] tracking-[1.6px] uppercase text-slate-400 font-bold block">
              HOTLINE TƯ VẤN KỸ THUẬT
            </span>
            <a
              href="tel:0988234899"
              className="mt-1.5 inline-flex items-center gap-2.5 text-2xl font-bold text-[#071a36] hover:text-[#1469db] transition"
            >
              <FiPhoneCall className="w-5 h-5 text-[#1469db]" /> 0988 • 234 •
              899
            </a>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6 reveal delay-1">
          <form
            onSubmit={handleSubmit}
            className="p-8 sm:p-10 rounded-[28px] bg-[#eef6ff] border border-[#1469db]/15 shadow-[0_25px_65px_rgba(13,74,143,0.1)] space-y-6"
          >
            <div>
              <label className="block text-[10px] tracking-[1.6px] uppercase font-bold text-slate-600 mb-1">
                HỌ VÀ TÊN
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn An"
                className="w-full bg-transparent border-0 border-b border-slate-400/60 py-2.5 text-sm text-[#071a36] focus:outline-none focus:border-[#1469db]"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[1.6px] uppercase font-bold text-slate-600 mb-1">
                SỐ ĐIỆN THOẠI
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0901 234 567"
                className="w-full bg-transparent border-0 border-b border-slate-400/60 py-2.5 text-sm text-[#071a36] focus:outline-none focus:border-[#1469db]"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[1.6px] uppercase font-bold text-slate-600 mb-1">
                NHU CẦU ÁP DỤNG
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-transparent border-0 border-b border-slate-400/60 py-2.5 text-sm text-[#071a36] focus:outline-none focus:border-[#1469db]"
              >
                <option>Gia đình có người cao tuổi sống riêng</option>
                <option>Viện dưỡng lão / Trung tâm chăm sóc</option>
                <option>Bệnh viện / Khoa Phục hồi chức năng</option>
                <option>Đối tác phân phối &amp; Triển khai</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] tracking-[1.6px] uppercase font-bold text-slate-600 mb-1">
                GHI CHÚ CỤ THỂ
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Số lượng phòng cần giám sát, yêu cầu kỹ thuật..."
                className="w-full bg-transparent border-0 border-b border-slate-400/60 py-2.5 text-sm text-[#071a36] focus:outline-none focus:border-[#1469db]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-5 rounded-[14px] text-white text-[11px] tracking-[1.4px] uppercase font-bold flex items-center justify-between shadow-[0_12px_28px_rgba(20,105,219,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #0c4eaa, #1687df)",
              }}
            >
              <span>Gửi Yêu Cầu Nhận Giải Pháp</span>
              <FiArrowRight className="w-4 h-4" />
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <FiShield className="w-3.5 h-3.5 text-[#1469db]" />
              Dữ liệu sức khỏe được bảo mật tuyệt đối theo chuẩn y tế.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
