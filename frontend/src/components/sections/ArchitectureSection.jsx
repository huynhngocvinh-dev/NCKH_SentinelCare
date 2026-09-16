
import {
  FiRadio,
  FiVideo,
  FiActivity,
  FiUserCheck,
  FiMapPin,
  FiLock,
} from "react-icons/fi";

export default function ArchitectureSection() {
  return (
    <section id="cong-nghe" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            TRỌNG TÂM KHOA HỌC 01
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            Kiến Trúc Thu Thập & Hợp Nhất Dữ Liệu Đa Luồng
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            Nguyên lý ”Bù trừ điểm mù”: Thiết bị đeo xác thực danh tính và quán
            tính; Mắt thần AI không gian xác thực hình ảnh chuyển động, triệt
            tiêu 100% khiếm khuyết của các hệ thống đơn phương thức.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Stream A */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <FiRadio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  STREAM A • ĐÍCH DANH CÁ THỂ
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Thiết Bị Đeo IoT Tích Hợp IMU 6 Trục
                </h3>
              </div>
            </div>

            <div className="h-48 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-medium text-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-100 flex items-center justify-center">
                <span className="text-slate-600 font-medium">
                  Cảm biến IMU 6 trục đeo cổ / cổ tay
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiActivity className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Thuật toán Quán tính Gia tốc 100Hz:
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ghi nhận liên tục vector gia tốc 3D (Ax, Ay, Az) và vận tốc
                    góc (Gx, Gy, Gz). Phân tích dạng sóng va đập đỉnh kết hợp
                    khoảng thời gian bất động tức thì.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiUserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Nhận Diện Đích Danh (Patient ID Binding):
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Thiết bị mang mã định danh duy nhất gắn chặt với hồ sơ y bạ
                    điện tử (ví dụ: Cụ ông Nguyễn Văn An, tiền sử nhồi máu cơ
                    tim, nhóm máu O+).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stream B */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <FiVideo className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase">
                  STREAM B • KHÔNG GIAN & BỐI CẢNH
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Mạng Lưới Camera Thị Giác Máy Tính Edge AI
                </h3>
              </div>
            </div>

            <div className="h-48 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-medium text-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-100 to-slate-100 flex items-center justify-center">
                <span className="text-purple-700 font-medium">
                  Model Vision Pose 17 Điểm Xương
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiActivity className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    AI Pose Estimation 17 Khớp Xương:
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mô hình học sâu lượng tử hóa chạy trực tiếp trên vi xử lý
                    NPU biên. Tính toán tỷ lệ góc nghiêng thân người và tốc độ
                    hạ thấp tâm khối thân thể.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Định Vị Tọa Độ Phòng Ngã Cực Kỳ Chính Xác:
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Phân vùng bản đồ không gian nhà theo nhân thực tế: "Cầu
                    thang tầng 1", "Hành lang giữa bếp và phòng khách". Cho phép
                    cứu hộ đi thẳng đến mục tiêu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiLock className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Kiến Trúc Bảo Mật Zero-Footprint Video:
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hình ảnh quang học được NPU phân tích ngay trong bộ nhớ RAM
                    tạm thời và hủy ngay lập tức; chỉ truyền đi tập tọa độ
                    vector khớp xương, tôn trọng tuyệt đối quyền riêng tư.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
