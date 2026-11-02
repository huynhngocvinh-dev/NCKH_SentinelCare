import { useCallback, useEffect, useState } from "react";
import {
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { incidentApi } from "../services/api";

const PAGE_SIZE = 10;

const STATUS_MAP = {
  PENDING: { label: "Đang chờ xác minh", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED_FALL: {
    label: "Đã xác nhận té ngã",
    cls: "bg-red-100 text-red-700",
  },
  ACKNOWLEDGED: {
    label: "Người thân đã xác nhận",
    cls: "bg-emerald-100 text-emerald-700",
  },
  CANCELLED_BY_USER: {
    label: "Đã hủy (báo nhầm)",
    cls: "bg-slate-200 text-slate-700",
  },
  SOS_BY_USER: {
    label: "Người dùng bấm SOS",
    cls: "bg-orange-100 text-orange-700",
  },
  FALSE_POSITIVE: { label: "Báo động giả", cls: "bg-slate-200 text-slate-700" },
};

const CALL_MAP = {
  CALL_NOT_STARTED: "Chưa gọi",
  CALLING: "Đang gọi",
  CALL_CONNECTED: "Đã gọi",
  CALL_TIMEOUT: "Không nghe máy",
  ESCALATION_STOPPED: "Đã dừng leo thang",
};

// Ảnh có thể là URL, data URL hoặc base64 thô
const toImageSrc = (value) =>
  value.startsWith("data:") || value.startsWith("http") || value.startsWith("/")
    ? value
    : `data:image/jpeg;base64,${value}`;

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  const load = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const { data } = await incidentApi.getHistory(targetPage, PAGE_SIZE);
      setItems(data.content);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      toast.error(err.message || "Không thể tải lịch sử sự cố.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Lịch Sử Sự Cố Té Ngã
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalElements > 0
                ? `Tổng cộng ${totalElements} sự cố được ghi nhận`
                : "Các sự cố do camera AI và thiết bị đeo ghi nhận sẽ hiển thị tại đây"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-medium animate-pulse">
              ⏳ Đang tải lịch sử sự cố...
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">
              Chưa có sự cố nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Nguồn phát hiện</th>
                    <th className="px-4 py-3">Người được giám sát</th>
                    <th className="px-4 py-3">Vị trí</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Cuộc gọi</th>
                    <th className="px-4 py-3">Ảnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const status = STATUS_MAP[item.status] || {
                      label: item.status,
                      cls: "bg-slate-100 text-slate-700",
                    };
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                          {item.incidentTimeFormatted}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.detectionSource}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold">
                          {item.patientName}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.locationAddress}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {CALL_MAP[item.callEscalationStatus] || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {item.snapshotUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage(toImageSrc(item.snapshotUrl))
                              }
                              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              <FiImage className="w-4 h-4" />
                              Xem ảnh
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => load(page - 1)}
                disabled={loading || page === 0}
                className="flex items-center gap-1 bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" /> Trước
              </button>
              <button
                type="button"
                onClick={() => load(page + 1)}
                disabled={loading || page + 1 >= totalPages}
                className="flex items-center gap-1 bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Sau <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Ảnh chụp từ camera"
              className="w-full rounded-xl border-4 border-white shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
