import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import RelativeHeader from "../components/relative/RelativeHeader";
import PatientInfoCard from "../components/relative/PatientInfoCard";
import EscalationMechanism from "../components/relative/EscalationMechanism";
import RelativeList from "../components/relative/RelativeList";
import LookupAndAddForm from "../components/relative/LookupAndAddForm";
import GeneralSettings from "../components/relative/GeneralSettings";

const API_BASE = "http://localhost:8080/api/emergency-contacts";

export default function RelativeManagementPage() {
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatives = async () => {
    setLoading(true);
    try {
      const fgUser = JSON.parse(localStorage.getItem("fg_user") || "{}");
      const token = fgUser.token;

      if (!token) {
        toast.warn("Vui lòng đăng nhập để xem danh sách người thân!");
        setLoading(false);
        return;
      }

      const res = await fetch(API_BASE, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRelatives(data);
      } else if (res.status === 403) {
        toast.error(
          "Phiên đăng nhập hết hạn hoặc bị từ chối! Vui lòng đăng nhập lại."
        );
      } else {
        toast.error("Không thể tải danh sách người thân từ hệ thống.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối tới máy chủ Backend!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatives();
  }, []);

  const handleAddRelativeSuccess = () => {
    fetchRelatives();
  };

  const handleCall = (phone) => {
    toast.info(`📞 Đang quay số tới: ${phone}`);
  };

  const handleSms = (phone) => {
    toast.info(`✉️ Đang soạn tin nhắn SMS tới: ${phone}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <RelativeHeader />

        {/* Thẻ Sinh hiệu Người Giám Sát */}
        <PatientInfoCard />

        {/* Cơ chế leo thang */}
        <EscalationMechanism />

        {/* Khung nội dung 2 Cột */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Cột trái: Danh sách người thân ưu tiên từ CSDL */}
          <div className="lg:col-span-7">
            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium animate-pulse">
                ⏳ Đang tải danh sách người thân...
              </div>
            ) : (
              <RelativeList
                relatives={relatives}
                onCall={handleCall}
                onSms={handleSms}
              />
            )}
          </div>

          {/* Cột phải: Tra cứu & Thêm người nhận cảnh báo */}
          <div className="lg:col-span-5">
            <LookupAndAddForm onAddSuccess={handleAddRelativeSuccess} />
          </div>
        </div>

        {/* Khung Cài Đặt Chung */}
        <GeneralSettings />
      </div>
    </div>
  );
}
