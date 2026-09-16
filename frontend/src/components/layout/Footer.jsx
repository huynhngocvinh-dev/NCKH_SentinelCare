import React from "react";
import {
  FiShield,
  FiPhoneCall,
  FiMail,
  FiMapPin,
  FiExternalLink,
} from "react-icons/fi";
import { toast } from "react-toastify";

export default function Footer() {
  const handleFeatureNotice = (name) => {
    toast.info(`Trang "${name}" đang được cập nhật tài liệu y tế mới nhất.`);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FiShield className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">
                  SentinelCare
                </span>
                <span className="ml-2 bg-blue-900/60 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-700/50">
                  AI TELEREHABILITATION
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              Nền tảng phát hiện té ngã thế hệ mới cho trung tâm dưỡng lão và
              bệnh nhân cao tuổi. Đồng bộ hóa dữ liệu thời gian thực giữa Radar
              mmWave, Camera AI bảo vệ riêng tư và thiết bị đeo y tế.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-slate-800 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Monitoring Core
              </span>
              <span className="bg-slate-800 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                FDA Class II Ready
              </span>
            </div>
          </div>

          {/* Column 1 */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold tracking-wider uppercase">
              Kiến Trúc & Giải Pháp
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleFeatureNotice("Mạng Lưới Sensor Fusion")}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Mạng Lưới Sensor Fusion
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFeatureNotice("Bộ Lọc Xác Minh 25 Giây")}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Bộ Lọc Xác Minh 25 Giây
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    handleFeatureNotice("Quy Trình Điều Phối 3 Cấp")
                  }
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Quy Trình Điều Phối 3 Cấp
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFeatureNotice("Giả Lập Tình Huống Khẩn")}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Giả Lập Tình Huống Khẩn
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold tracking-wider uppercase">
              Tuân Thủ Y Khoa
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">✓</span> Chuẩn HIPAA HITECH
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">✓</span> Interoperability HL7
                / FHIR
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">✓</span> ISO 27799:2016 Y Tế
              </li>
              <li>
                <button
                  onClick={() =>
                    toast.success(
                      "Đang tải tài liệu Báo Cáo Thẩm Định Lâm Sàng (PDF)..."
                    )
                  }
                  className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 mt-1 cursor-pointer"
                >
                  Xem Báo Cáo Thẩm Định{" "}
                  <FiExternalLink className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <h4 className="text-rose-400 text-sm font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Trực Cấp Cứu 24/7
            </h4>
            <p className="text-xs text-slate-400 leading-normal">
              Tích hợp kết nối trực tiếp tổng đài ứng cứu khẩn cấp y tế quốc gia
              và đội ngũ điều dưỡng tại chỗ.
            </p>
            <div className="pt-1">
              <div className="text-xs text-slate-400">
                Hotline Cứu Hộ Ưu Tiên:
              </div>
              <a
                href="tel:115"
                className="text-xl font-black text-rose-500 hover:text-rose-400 flex items-center gap-2 mt-0.5"
              >
                <FiPhoneCall className="w-5 h-5" /> 115 / 0988 234 899
              </a>
              <span className="text-[11px] text-slate-500 block mt-1">
                Hỗ trợ kỹ thuật: 1900 8899
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SentinelCare AI Inc. Giữ toàn bộ bản
            quyền sở hữu trí tuệ giải pháp giám sát té ngã.
          </div>
          <div className="flex flex-wrap gap-6">
            <button
              onClick={() => handleFeatureNotice("Điều khoản dịch vụ")}
              className="hover:text-slate-400 transition-colors cursor-pointer"
            >
              Điều khoản Dịch vụ
            </button>
            <button
              onClick={() => handleFeatureNotice("Bảo mật dữ liệu bệnh nhân")}
              className="hover:text-slate-400 transition-colors cursor-pointer"
            >
              Bảo mật Dữ liệu Bệnh nhân
            </button>
            <button
              onClick={() => handleFeatureNotice("Tình trạng Hệ thống")}
              className="hover:text-slate-400 transition-colors cursor-pointer"
            >
              Tình trạng Hệ thống
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
