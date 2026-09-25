import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import api from "../services/api";
import RelativeHeader from "../components/relative/RelativeHeader";
// import PatientInfoCard from "../components/relative/PatientInfoCard";
import EscalationMechanism from "../components/relative/EscalationMechanism";
import RelativeList from "../components/relative/RelativeList";
import LookupAndAddForm from "../components/relative/LookupAndAddForm";
import GeneralSettings from "../components/relative/GeneralSettings";

export default function RelativeManagementPage() {
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatives = async () => {
    setLoading(true);
    try {
      //Gọi API thông qua instance 'api', Interceptor sẽ tự động chèn Token
      const res = await api.get("/emergency-contacts");
      setRelatives(res.data);
    } catch (err) {
      // Interceptor đã chuẩn hóa thông điệp lỗi trong err.message
      toast.error(
        err.message || "Không thể tải danh sách người thân từ hệ thống."
      );
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
        {/* <PatientInfoCard /> */}

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
