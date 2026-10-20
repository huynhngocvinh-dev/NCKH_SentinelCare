export default function HeaderBar() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          TELEMETRY MESH V4.8 • THIẾT LẬP PHẦN CỨNG Y TẾ
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
          Cấu hình Kết nối Thiết bị & Camera Giám sát
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Thêm mới thiết bị đeo IoT khẩn cấp và mạng lưới Camera AI theo dõi
          không gian nhà. Hệ thống tự động đồng bộ luồng telemetry 60Hz.
        </p>
      </div>

      <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            BĂNG THÔNG CỤC BỘ
          </div>
          <div className="text-lg font-black text-blue-600">
            0.42{" "}
            <span className="text-xs font-normal text-slate-500">
              ms latency
            </span>
          </div>
        </div>
        <div className="text-right border-l border-slate-200 pl-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            CẢM BIẾN TRỰC TUYẾN
          </div>
          <div className="text-lg font-black text-slate-900">
            2/8 <span className="text-xs font-normal text-slate-500">kênh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
