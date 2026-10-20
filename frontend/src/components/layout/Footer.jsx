import React from "react";
import {
  FiShield,
  FiPhoneCall,
  FiExternalLink,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function Footer() {
  const handleFeatureNotice = (name) => {
    toast.info(`Trang "${name}" đang được cập nhật tài liệu y tế mới nhất.`);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-16 pb-12 font-sans">
      {/* Khung chứa max-w-[1440px] đồng bộ chuẩn với Navbar & HeroSection */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        
        {/* Lưới 5 cột rộng rãi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Thông tin thương hiệu (Chiếm 2 cột) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FiShield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">
                  SentinelCare
                </span>
                <span className="ml-3 bg-blue-950 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-800/60">
                  AI TELEREHABILITATION
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed pr-8">
              Nền tảng phát hiện té ngã thế hệ mới cho trung tâm dưỡng lão và bệnh nhân cao tuổi. Đồng bộ hóa dữ liệu thời gian thực giữa Radar mmWave, Camera AI bảo vệ riêng tư và thiết bị đeo y tế.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <span className="bg-slate-900 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Monitoring Core
              </span>
              <span className="bg-slate-900 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-800">
                FDA Class II Ready
              </span>
            </div>
          </div>

          {/* Cột 1: Giải pháp */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold tracking-wider uppercase">
              Kiến Trúc & Giải Pháp
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  onClick={() => handleFeatureNotice("Mạng Lưới Sensor Fusion")}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Mạng Lưới Sensor Fusion
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFeatureNotice("Bộ Lọc Xác Minh 25 Giây")}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Bộ Lọc Xác Minh 25 Giây
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFeatureNotice("Quy Trình Điều Phối 3 Cấp")}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Quy Trình Điều Phối 3 Cấp
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFeatureNotice("Giả Lập Tình Huống Khẩn")}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Giả Lập Tình Huống Khẩn
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 2: Chuẩn Y Khoa */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-bold tracking-wider uppercase">
              Tuân Thủ Y Khoa
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> Chuẩn HIPAA HITECH
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> HL7 / FHIR Interoperability
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400 font-bold">✓</span> ISO 27799:2016 Y Tế
              </li>
              <li>
                <button
                  onClick={() =>
                    toast.success("Đang tải tài liệu Báo Cáo Thẩm Định Lâm Sàng (PDF)...")
                  }
                  className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 mt-1 cursor-pointer"
                >
                  Xem Báo Cáo Thẩm Định <FiExternalLink className="w-4 h-4" />
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: Trực cấp cứu */}
          <div className="space-y-4">
            <h4 className="text-rose-400 text-sm font-bold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Trực Cấp Cứu 24/7
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tích hợp kết nối trực tiếp tổng đài ứng cứu khẩn cấp y tế quốc gia và điều dưỡng tại chỗ.
            </p>
            <div className="pt-2">
              <div className="text-xs uppercase font-bold text-slate-500">
                Hotline Cứu Hộ Ưu Tiên:
              </div>
              <a
                href="tel:115"
                className="text-xl font-black text-rose-500 hover:text-rose-400 flex items-center gap-2 mt-1"
              >
                <FiPhoneCall className="w-5 h-5" /> 115 / 0988 234 899
              </a>
              <span className="text-xs text-slate-500 block mt-1">
                Hỗ trợ kỹ thuật: 1900 8899
              </span>
            </div>
          </div>
        </div>

        {/* Chân trang dưới cùng */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SentinelCare AI Inc. Giữ toàn bộ bản quyền giải pháp giám sát té ngã.
          </div>
          <div className="flex flex-wrap gap-8">
            <button
              onClick={() => handleFeatureNotice("Điều khoản dịch vụ")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Điều khoản Dịch vụ
            </button>
            <button
              onClick={() => handleFeatureNotice("Bảo mật dữ liệu bệnh nhân")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Bảo mật Dữ liệu Bệnh nhân
            </button>
            <button
              onClick={() => handleFeatureNotice("Tình trạng Hệ thống")}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Tình trạng Hệ thống
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}