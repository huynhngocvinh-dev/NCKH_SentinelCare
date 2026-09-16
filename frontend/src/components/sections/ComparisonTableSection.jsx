import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { COMPARISON_DATA } from "../../data/mockData";

export default function ComparisonTableSection() {
  const renderStatus = (item) => {
    if (!item) return <span className="text-slate-400 font-normal">--</span>;
    if (item.status === "good") {
      return (
        <span className="text-blue-700 font-semibold text-xs flex items-center gap-1.5 justify-center sm:justify-start">
          <FiCheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          {item.text}
        </span>
      );
    }
    if (item.status === "medium") {
      return (
        <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5 justify-center sm:justify-start">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {item.text}
        </span>
      );
    }
    return (
      <span className="text-red-600 font-medium text-xs flex items-center gap-1.5 justify-center sm:justify-start">
        <FiXCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        {item.text}
      </span>
    );
  };

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            THẨM ĐỊNH HIỆU QUẢ
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            So Sánh Đề Tài Với Các Phương Pháp Truyền Thống
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Kết quả đo kiểm thực nghiệm dựa trên cơ sở dữ liệu ngã chuẩn quốc tế
            UR Fall Detection Dataset kết hợp môi trường phòng thí nghiệm sinh
            hoạt thực tế.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-bold uppercase">
                <th className="p-4 border-b border-slate-200">
                  Tiêu Chí Đánh Giá Lâm Sàng
                </th>
                <th className="p-4 border-b border-slate-200">
                  Vòng Đeo Bấm Nút Cũ
                </th>
                <th className="p-4 border-b border-slate-200">
                  Camera Giám Sát CCTV
                </th>
                <th className="p-4 border-b border-slate-200 bg-blue-50 text-blue-800 font-black">
                  SENTINELCARE AI ĐA LUỒNG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {COMPARISON_DATA.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-4 font-semibold text-slate-900">
                    {row.criteria}
                  </td>
                  <td className="p-4">{renderStatus(row.oldWrist)}</td>
                  <td className="p-4">{renderStatus(row.cctv)}</td>
                  <td className="p-4 bg-blue-50/50">
                    {renderStatus(row.sentinel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
