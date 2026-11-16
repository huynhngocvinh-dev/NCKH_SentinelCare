import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { incidentApi } from "../../services/api";
import { useIncidentWebSocket } from "../../hooks/useIncidentWebSocket";

// Ảnh có thể là URL, data URL hoặc base64 thô
const toImageSrc = (value) =>
  value.startsWith("data:") || value.startsWith("http") || value.startsWith("/")
    ? value
    : `data:image/jpeg;base64,${value}`;

// Trạng thái nghĩa là sự cố không còn cần cảnh báo
const CLOSED_STATUSES = ["ACKNOWLEDGED", "CANCELLED_BY_USER", "FALSE_POSITIVE"];

export const IncidentModal = () => {
  // Hàng đợi sự cố: hiện cái đầu tiên, các cái sau xếp hàng
  const [queue, setQueue] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const audioRef = useRef(null);

  useIncidentWebSocket((msg) => {
    if (msg.type === "STATUS_UPDATE") {
      // Đã xác nhận ở nơi khác (email, thiết bị khác): đóng cảnh báo
      if (CLOSED_STATUSES.includes(msg.status)) {
        setQueue((prev) => prev.filter((i) => i.id !== msg.id));
      }
      return;
    }
    setQueue((prev) =>
      prev.some((i) => i.id === msg.id) ? prev : [...prev, msg]
    );
  });

  // Chuông lặp lại khi còn cảnh báo, tắt khi hết
  const hasIncident = queue.length > 0;
  useEffect(() => {
    if (!hasIncident) {
      audioRef.current?.pause();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio("/alarm.mp3");
      audioRef.current.loop = true;
    }
    audioRef.current
      .play()
      .catch((e) => console.log("Trinh duyet chan tu dong phat am thanh:", e));
    return () => audioRef.current?.pause();
  }, [hasIncident]);

  const current = queue[0];

  const handleAcknowledge = async () => {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await incidentApi.acknowledge(current.id);
      setQueue((prev) => prev.filter((i) => i.id !== current.id));
      toast.success("Đã ghi nhận xác nhận sự cố.");
    } catch (error) {
      toast.error(error.message || "Không thể gửi xác nhận. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!current) return null;

  const googleMapsUrl =
    current.latitude && current.longitude
      ? `https://maps.google.com/?q=${current.latitude},${current.longitude}`
      : null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border-4 border-red-600 p-6 max-w-md w-full shadow-2xl text-center relative z-[100000]">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 animate-bounce">
          🚨
        </div>

        <h2 className="text-xl font-extrabold text-red-600 mb-1">
          CẢNH BÁO TÉ NGÃ KHẨN CẤP!
        </h2>
        {queue.length > 1 && (
          <p className="text-xs text-red-500 font-semibold mb-1">
            Còn {queue.length - 1} cảnh báo khác đang chờ
          </p>
        )}

        <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-red-300">
          Nguồn: {current.source}
        </span>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left mb-4 space-y-1.5">
          <p className="text-sm text-slate-700">
            <strong>👤 Bệnh nhân:</strong>{" "}
            <span className="text-red-600 font-bold">
              {current.patientName}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            <strong>📍 Vị trí:</strong> {current.location}
          </p>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold underline mt-1"
            >
              🗺️ Xem vị trí thực trên Google Maps
            </a>
          )}
        </div>

        {current.snapshotUrl && (
          <img
            src={toImageSrc(current.snapshotUrl)}
            alt="Camera Snapshot"
            className="w-full h-40 object-cover rounded-lg mb-4 border"
          />
        )}

        <button
          onClick={handleAcknowledge}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-5 rounded-xl transition duration-200 shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>✓</span> {submitting ? "ĐANG GỬI..." : "XÁC NHẬN ĐÃ NHẬN TIN"}
        </button>
        <p className="text-[11px] text-slate-500 mt-2">
          Xác nhận chỉ ghi nhận bạn đã nắm thông tin. Hệ thống vẫn tiếp tục gọi
          người thân (nếu gói hỗ trợ).
        </p>
      </div>
    </div>
  );
};
