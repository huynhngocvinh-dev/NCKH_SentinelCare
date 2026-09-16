import { useState } from "react";
import { FiSend, FiPhoneCall, FiCheckCircle } from "react-icons/fi";
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
      className="py-16 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-2xl grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Info Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="bg-blue-500/30 text-blue-100 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 inline-block">
              HỢP TÁC NGHIÊN CỨU & ỨNG DỤNG LÂM SÀNG
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Sẵn Sàng Triển Khai Cho Bệnh Viện, Viện Dưỡng Lão & Gia Đình
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Đề tài sẵn sàng cung cấp tài liệu giải thuật, kết nối API hệ thống
              quản lý bệnh viện (HIS/EMR) và trang bị các bộ thí điểm (Pilot
              kits) cảm biến + camera biển cho các đơn vị y tế tại Việt Nam.
            </p>

            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Hỗ trợ lắp đặt và bàn giao kỹ thuật tận nơi trong 24 giờ.
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Đào tạo điều dưỡng viên và gia đình vận hành thành thạo.
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Cam kết bảo mật dữ liệu sức khỏe tuyệt đối theo chuẩn y tế.
              </li>
            </ul>

            <div className="pt-4 border-t border-blue-500/50">
              <span className="text-xs text-blue-200 uppercase font-semibold block">
                HOTLINE TƯ VẤN ĐỀ TÀI KHOA HỌC
              </span>
              <a
                href="tel:0988234899"
                className="text-2xl font-black text-white hover:text-emerald-300 transition-colors flex items-center gap-2 mt-1"
              >
                <FiPhoneCall className="w-6 h-6" /> 0988 • 234 • 899
              </a>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-6">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-lg space-y-4"
            >
              <h3 className="text-xl font-black text-slate-900">
                Đăng Ký Nhận Tư Vấn & Trải Nghiệm Pilot
              </h3>
              <p className="text-xs text-slate-500">
                Điền thông tin để hội đồng nghiên cứu liên hệ và gửi bản demo kỹ
                thuật chi tiết.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="090 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loại Hình Áp Dụng Quan Tâm
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                >
                  <option>Gia đình có người cao tuổi sống riêng</option>
                  <option>Viện dưỡng lão / Trung tâm chăm sóc</option>
                  <option>Bệnh viện / Khoa Phục hồi chức năng</option>
                  <option>Đối tác phân phối & Triển khai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi Chú Nhu Cầu Cụ Thể
                </label>
                <textarea
                  rows="3"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Số lượng phòng cần giám sát, địa chỉ lắp đặt hoặc yêu cầu kỹ thuật..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <FiSend className="w-4 h-4" />
                Gửi Yêu Cầu Nhận Giải Pháp
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
