
import { FiClock, FiPhoneOff, FiEyeOff } from "react-icons/fi";

export default function PainPointsSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            TÍNH CẤP THIẾT Y TẾ & THỰC TRẠNG BỆNH NHÂN
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2 leading-tight">
            Té Ngã Ở Người Cao Tuổi: Kẻ Giết Người Thầm Lặng Sau ”Thời Gian
            Vàng” Cứu Hộ
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
            Theo Tổ chức Y tế Thế giới (WHO), té ngã là nguyên nhân gây tử vong
            thứ hai do tai nạn thương tích không cố ý. Đối với người cao tuổi
            sống neo đơn, sự nguy hiểm không chỉ đến từ cú ngã, mà nằm ở khoảng
            thời gian nằm bất động mà không có ai phát hiện.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <FiClock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Quy Tắc 30 Phút Vàng
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Người cao tuổi nằm bất động sau té ngã quá 30 phút làm tăng tỷ lệ
              tử vong lên <strong>50%</strong> do hạ thân nhiệt, hoại tử cơ
              (rhabdomyolysis), mất nước và tổn thương thần kinh vĩnh viễn.
            </p>
            <div className="bg-red-50/50 text-red-700 text-xs px-3 py-2 rounded-lg font-medium border border-red-100">
              Nguồn: Báo cáo Dịch tễ học Geriatrics Journal
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiPhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Bất Cập Thiết Bị Đơn Lẻ
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Vòng đeo SOS đòi hỏi người ngã phải còn tỉnh táo để bấm nút; hơn{" "}
              <strong>68%</strong> người cao tuổi tháo vòng khi ngủ hoặc tắm -
              chính là những lúc xác suất trượt chân ngã cao nhất.
            </p>
            <div className="bg-slate-100 text-slate-700 text-xs px-3 py-2 rounded-lg font-medium">
              Rủi ro: Người bệnh bất tỉnh không thể bấm nút
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiEyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Điểm Mù Camera Độc Lập
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Camera thông thường bị vật cản (ghế, rèm cửa, góc tường), không
              phân biệt được danh tính nếu nhà có nhiều người, và đặc biệt không
              được lắp ở khu vực riêng tư như nhà tắm hay phòng thay đồ.
            </p>
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg font-medium border border-blue-100">
              Giải pháp: Cảm biến bù trừ đa luồng thông minh SentinelCare
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
