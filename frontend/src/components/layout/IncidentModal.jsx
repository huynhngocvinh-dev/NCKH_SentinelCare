// src/components/IncidentModal.jsx
import React, { useState } from "react";
import { incidentApi } from "../../services/api";
import { useIncidentWebSocket } from "../../hooks/useIncidentWebSocket";

export const IncidentModal = () => {
  const [currentIncident, setCurrentIncident] = useState(null);

  useIncidentWebSocket((incident) => {
    setCurrentIncident(incident);

    try {
      const audio = new Audio("/alarm.mp3");
      audio.play().catch((e) => console.log("Autoplay audio bị chặn:", e));
    } catch (e) {
      console.error("Lỗi phát âm thanh:", e);
    }
  });

  const handleAcknowledge = async () => {
    if (!currentIncident) return;

    try {
      await incidentApi.acknowledge(currentIncident.id);
      alert("✅ Đã xác nhận sự cố! Hủy cuộc gọi khẩn cấp GSM thành công.");
      setCurrentIncident(null);
    } catch (error) {
      console.error("Lỗi khi bấm xác nhận:", error);
      alert(error.message || "Không thể gửi xác nhận. Vui lòng thử lại!");
    }
  };

  if (!currentIncident) return null;

  const googleMapsUrl =
    currentIncident.latitude && currentIncident.longitude
      ? `https://maps.google.com/?q=${currentIncident.latitude},${currentIncident.longitude}`
      : null;

  return (
    /* 🟢 CHUẨN CẮT LỚP: top-0 left-0 w-screen h-screen z-[99999] giúp Modal đè lên 100% màn hình */
    <div className="fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      {/* Khung Modal vừa vặn nằm chuẩn chính giữa */}
      <div className="bg-white rounded-2xl border-4 border-red-600 p-6 max-w-md w-full shadow-2xl text-center relative z-[100000]">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 animate-bounce">
          🚨
        </div>

        <h2 className="text-xl font-extrabold text-red-600 mb-1">
          CẢNH BÁO TÉ NGÃ KHẨN CẤP!
        </h2>

        <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-red-300">
          Nguồn: {currentIncident.source}
        </span>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left mb-4 space-y-1.5">
          <p className="text-sm text-slate-700">
            <strong>👤 Bệnh nhân:</strong>{" "}
            <span className="text-red-600 font-bold">
              {currentIncident.patientName}
            </span>
          </p>
          <p className="text-sm text-slate-700">
            <strong>📍 Vị trí:</strong> {currentIncident.location}
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

        {currentIncident.snapshotUrl && (
          <img
            src={currentIncident.snapshotUrl}
            alt="Camera Snapshot"
            className="w-full h-40 object-cover rounded-lg mb-4 border"
          />
        )}

        <button
          onClick={handleAcknowledge}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition duration-200 shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>✓</span> XÁC NHẬN (HỦY GỌI GSM)
        </button>
      </div>
    </div>
  );
};
