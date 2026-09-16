export const SCENARIOS = {
  relax: {
    title: "Kịch Bản 1: Ngồi Thư Giãn",
    imuStatus: "Gia Tốc: 0.98G (Tĩnh)",
    imuDesc: "Cụ đang ngồi bình thường trên ghế xem TV.",
    visionStatus: "Khung Xương: Thẳng Đứng",
    visionDesc: "Camera Phòng khách xác nhận cơ thể trong phạm vi an toàn.",
    systemDecision: "AN TOÀN TUYỆT ĐỐI",
    systemDesc: "Không kích hoạt chu kỳ cứu hộ. Giữ yên tĩnh cho gia đình.",
    alertType: "safe",
  },
  drop: {
    title: "Kịch Bản 2: Rơi Thiết Bị",
    imuStatus: "Gia Tốc: 3.2G (Va đập) -> 0G",
    imuDesc: "Thiết bị phát hiện va chạm mạnh xuống sàn nhà.",
    visionStatus: "Khung Xương: Thẳng Đứng (Đang di chuyển)",
    visionDesc: "Camera thấy cụ vẫn đang đứng/đi lại bình thường.",
    systemDecision: "BÁO ĐỘNG GIẢ - TỰ HỦY",
    systemDesc:
      "Hệ thống Cross-Check phát hiện chỉ rơi thiết bị. Hủy báo động.",
    alertType: "warning",
  },
  fall: {
    title: "Kịch Bản 3: Té Ngã Khẩn Cấp",
    imuStatus: "Gia Tốc: 4.5G (Ngã va đập) -> Nằm im",
    imuDesc: "Tín hiệu gia tốc xác nhận cú rơi tự do và mất chuyển động.",
    visionStatus: "Khung Xương: Nằm Ngang Sàn Nhà",
    visionDesc: "Vision AI phát hiện chiều cao trọng tâm hạ đột ngột.",
    systemDecision: "KÍCH HOẠT QUY TRÌNH CỨU HỘ 25S",
    systemDesc:
      "Phát hiện sự cố té ngã thực tế! Đang đếm ngược kích hoạt khẩn cấp.",
    alertType: "danger",
  },
};

export const COMPARISON_DATA = [
  {
    criteria: "Nhận diện ngã tự động (Không cần bấm nút)",
    oldWrist: { status: "bad", text: "Hoàn toàn bị động" },
    cctv: { status: "medium", text: "Tự động qua AI" },
    sentinel: { status: "good", text: "Tự động 100% (Đa luồng chéo)" },
  },
  {
    criteria: "Xác định đích danh cá nhân người té ngã",
    oldWrist: { status: "medium", text: "Biết ID vòng đeo" },
    cctv: { status: "bad", text: "Nhầm lẫn nếu nhiều người" },
    sentinel: { status: "good", text: "Chính xác từng cá thể qua ID IoT" },
  },
  {
    criteria: "Xác định chính xác vị trí phòng trong nhà",
    oldWrist: { status: "bad", text: "Chỉ biết trong nhà (GPS yếu)" },
    cctv: { status: "medium", text: "Biết tên phòng camera" },
    sentinel: { status: "good", text: "Phân vùng chính xác từng mét vuông" },
  },
  {
    criteria: "Tỷ lệ chống báo động giả (False Alarms)",
    oldWrist: { status: "bad", text: "Rất kém (> 35% do va quẹt)" },
    cctv: { status: "bad", text: "Kém (Thú cưng, rèm bay nhầm lẫn)" },
    sentinel: { status: "good", text: "> 99.1% Nhờ chu kỳ Grace 25s" },
  },
  {
    criteria: "Cơ chế tự động gọi xe cấp cứu y tế 115",
    oldWrist: { status: "bad", text: "Không hỗ trợ" },
    cctv: { status: "bad", text: "Không hỗ trợ" },
    sentinel: { status: "good", text: "Tích hợp API kết nối tổng đài y tế" },
  },
];
export const QUICK_SEARCHES = [
  "Cảm biến mmWave",
  "Xác minh 25s",
  "Camera AI Bảo mật",
  "Tổng đài 115",
  "HL7 / FHIR Y Tế",
];
