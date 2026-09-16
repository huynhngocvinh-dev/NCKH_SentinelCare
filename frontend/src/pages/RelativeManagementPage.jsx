import React, { useState } from "react";
import { toast } from "react-toastify";

import RelativeHeader from "../components/relative/RelativeHeader";
import PatientInfoCard from "../components/relative/PatientInfoCard";
import EscalationMechanism from "../components/relative/EscalationMechanism";
import RelativeList from "../components/relative/RelativeList";
import LookupAndAddForm from "../components/relative/LookupAndAddForm";
import GeneralSettings from "../components/relative/GeneralSettings";

const INITIAL_RELATIVES = [
  {
    id: 1,
    name: "Mẹ (Bạn)",
    role: "Chủ tài khoản",
    roleBadgeStyle: "bg-blue-600 text-white",
    statusText: "Đã nhận",
    phone: "0912 345 678",
    email: "me@email.com",
    channelDesc: "App + SMS + Cuộc gọi lập tức (0s - Tức thì)",
  },
  {
    id: 2,
    name: "Anh Nam (Nguyễn Hải Nam)",
    role: "Người nhận chính",
    roleBadgeStyle: "bg-blue-100 text-blue-700",
    statusText: "Đã nhận",
    phone: "0987 654 321",
    email: "nam@email.com",
    channelDesc: "Kích hoạt sau 25s nếu Mẹ chưa xác nhận an toàn",
  },
  {
    id: 3,
    name: "Chị Lan",
    role: "Người nhận phụ",
    roleBadgeStyle: "bg-slate-200 text-slate-700",
    statusText: "Đã nhận",
    phone: "0909 876 543",
    email: "lan@email.com",
    channelDesc: "Kích hoạt sau 50s nếu 2 cấp trên chưa phản hồi",
  },
  {
    id: 4,
    name: "Bác Minh",
    role: "Hàng xóm sao lưu (Phòng 205)",
    roleBadgeStyle: "bg-slate-200 text-slate-700",
    statusText: "Chưa nhận (SMS & Gọi)",
    phone: "0933 111 222",
    email: "minh@email.com",
    channelDesc: "Cuộc gọi tự động AI & SMS báo động sau 90s",
  },
];

export default function RelativeManagementPage() {
  const [relatives, setRelatives] = useState(INITIAL_RELATIVES);

  const handleAddRelative = (newRel) => {
    setRelatives((prev) => [...prev, newRel]);
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
          {/* Cột trái (7 Cột): Danh sách thứ tự ưu tiên leo thang */}
          <div className="lg:col-span-7">
            <RelativeList
              relatives={relatives}
              onCall={handleCall}
              onSms={handleSms}
            />
          </div>

          {/* Cột phải (5 Cột): Tra cứu & Thêm người nhận cảnh báo */}
          <div className="lg:col-span-5">
            <LookupAndAddForm onAddSuccess={handleAddRelative} />
          </div>
        </div>

        {/* Khung Cài Đặt Chung (Full-Width Chiếm Trọn Phía Dưới) */}
        <GeneralSettings />
      </div>
    </div>
  );
}
