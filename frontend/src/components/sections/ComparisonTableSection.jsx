// ComparisonTableSection.jsx
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { COMPARISON_DATA } from "../../data/mockData";

export default function ComparisonTableSection() {
  const renderStatus = (item) => {
    if (!item) return <span className="text-slate-400">--</span>;
    if (item.status === "good") {
      return (
        <span className="text-[#1469db] font-bold text-xs flex items-center gap-1.5">
          <FiCheckCircle className="w-4 h-4 text-[#1469db] shrink-0" />
          {item.text}
        </span>
      );
    }
    if (item.status === "medium") {
      return (
        <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {item.text}
        </span>
      );
    }
    return (
      <span className="text-rose-600 font-medium text-xs flex items-center gap-1.5">
        <FiXCircle className="w-4 h-4 text-rose-500 shrink-0" />
        {item.text}
      </span>
    );
  };

  return (
    <section className="py-24 bg-[#f8fbff]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
        <div className="max-w-3xl mb-12 reveal">
          <span className="text-[10px] tracking-[2.2px] uppercase text-[#1469db] font-bold">
            05 — THẨM ĐỊNH HIỆU QUẢ LÂM SÀNG
          </span>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#071a36] mt-2 leading-[1.05]">
            So sánh với phương pháp{" "}
            <em className="text-[#1469db] italic">truyền thống.</em>
          </h2>
          <p className="text-slate-600 mt-3 text-sm">
            Kết quả đo kiểm thực nghiệm dựa trên cơ sở dữ liệu ngã chuẩn quốc tế
            UR Fall Detection Dataset kết hợp môi trường sinh hoạt thực tế.
          </p>
        </div>

        <div className="overflow-x-auto rounded-[28px] border border-[#125bae]/15 bg-white shadow-[0_22px_55px_rgba(13,74,143,0.07)] reveal delay-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eaf3ff] text-[#071a36] text-[11px] font-bold uppercase tracking-wider">
                <th className="p-5 border-b border-[#125bae]/10">
                  Tiêu Chí Đánh Giá
                </th>
                <th className="p-5 border-b border-[#125bae]/10">
                  Vòng Bấm Nút Cũ
                </th>
                <th className="p-5 border-b border-[#125bae]/10">
                  Camera CCTV
                </th>
                <th className="p-5 border-b border-[#125bae]/10 bg-[#1469db] text-white">
                  SENTINELCARE ĐA LUỒNG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {COMPARISON_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f5faff] transition-colors">
                  <td className="p-5 font-semibold text-[#071a36]">
                    {row.criteria}
                  </td>
                  <td className="p-5">{renderStatus(row.oldWrist)}</td>
                  <td className="p-5">{renderStatus(row.cctv)}</td>
                  <td className="p-5 bg-blue-50/40">
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
