import React from "react";
import { FiSliders, FiBell, FiShare2, FiChevronRight } from "react-icons/fi";
import { toast } from "react-toastify";

export default function GeneralSettings() {
  const settingsOptions = [
    {
      id: "priority",
      icon: FiSliders,
      title: "Thứ tự ưu tiên thông báo",
      description:
        "Cấu hình độ trễ và thứ tự liên hệ từng bước khi xảy ra sự cố té ngã",
    },
    {
      id: "channels",
      icon: FiBell,
      title: "Cài đặt thông báo",
      description:
        "Chọn kênh nhận thông báo linh hoạt (Ứng dụng di động, Tin nhắn SMS, Cuộc gọi AI, Email y tế)",
    },
    {
      id: "sharing",
      icon: FiShare2,
      title: "Chia sẻ thiết bị",
      description:
        "Cho phép thành viên gia đình khác cùng theo dõi dữ liệu cảm biến thời gian thực",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <FiSliders className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-black text-slate-900">
          Cài Đặt Chung & Quản Trị Hệ Thống
        </h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {settingsOptions.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => toast.info(`Đang mở tùy chỉnh: ${item.title}`)}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
