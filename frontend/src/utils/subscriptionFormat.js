export const APP_NAME = "SentinelCare";

export const formatMoney = (value) =>
  `${Number(value ?? 0).toLocaleString("vi-VN")}đ`;

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// Chu kỳ thanh toán dùng trong câu thông báo: tháng / năm / N ngày
export const billingUnit = (plan) => {
  const days = plan?.durationDays;
  if (!days) return null; // gói trọn đời: không có chu kỳ
  if (days === 365) return "năm";
  if (days === 30) return "tháng";
  return `${days} ngày`;
};

// Thông báo minh bạch trước khi thanh toán (đúng nội dung đặc tả)
export const consentText = (unit) =>
  `Bằng việc bấm Thanh toán, bạn đồng ý cho phép ${APP_NAME} tự động gia hạn gói dịch vụ này mỗi ${unit}. Bạn có thể hủy bất kỳ lúc nào.`;

// Trạng thái gói
export const STATUS_META = {
  FREE: {
    label: "Gói Miễn phí",
    cls: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  ACTIVE: {
    label: "Đang hoạt động",
    cls: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  GRACE_PERIOD: {
    label: "Đang ân hạn",
    cls: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    cls: "bg-slate-200 text-slate-700",
    dot: "bg-slate-500",
  },
};

// Nhãn hiển thị cạnh tên tài khoản (giống nhãn "Plus" của Google)
export const PLAN_BADGES = {
  FREEMIUM: {
    label: "Free",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PRO_1YR: { label: "Pro", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PREMIUM_LIFETIME: {
    label: "Premium",
    cls: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent",
  },
};

export const planBadge = (code, name) =>
  PLAN_BADGES[code] ?? {
    label: name || "Gói",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  };

export const INVOICE_STATUS = {
  PENDING: { label: "Đang xử lý", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "Đã thanh toán", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Thất bại", cls: "bg-red-100 text-red-700" },
  CANCELED: { label: "Đã hủy", cls: "bg-slate-200 text-slate-700" },
};

// Phương thức thanh toán (cả hai đều hỗ trợ tự động gia hạn qua token do MoMo cấp)
export const PAYMENT_METHODS = [
  {
    code: "MOMO_WALLET",
    name: "Ví MoMo",
    desc: "Liên kết ví MoMo, xác thực ủy quyền một lần",
    color: "bg-pink-600 text-white",
    letter: "M",
    badge: "Đề xuất",
  },
  {
    code: "MOMO_CARD",
    name: "Thẻ Visa / Mastercard",
    desc: "Nhập thẻ trên trang bảo mật của MoMo",
    color: "bg-indigo-100 text-indigo-600",
    letter: "V",
  },
];

// Lý do hủy gia hạn (thu thập feedback)
export const CANCEL_REASONS = [
  { value: "TOO_EXPENSIVE", label: "Giá quá cao" },
  { value: "NOT_NEEDED", label: "Tôi không còn nhu cầu sử dụng" },
  { value: "MISSING_FEATURES", label: "Chưa có tính năng tôi cần" },
  { value: "SWITCHING", label: "Tôi chuyển sang dịch vụ khác" },
  { value: "PAYMENT_ISSUE", label: "Gặp vấn đề với thanh toán" },
  { value: "OTHER", label: "Lý do khác" },
];

// Nhãn + màu cho từng dòng nhật ký (subscription_logs)
export const ACTION_META = {
  ORDER_CREATED: { label: "Tạo hóa đơn", tone: "info" },
  PAYMENT_SUCCESS: { label: "Thanh toán thành công", tone: "success" },
  PAYMENT_FAILED: { label: "Thanh toán thất bại", tone: "danger" },
  SUBSCRIPTION_ACTIVATED: { label: "Kích hoạt gói", tone: "success" },
  UPGRADED: { label: "Nâng cấp gói", tone: "success" },
  DOWNGRADE_SCHEDULED: { label: "Lên lịch hạ gói", tone: "warn" },
  DOWNGRADE_CANCELLED: { label: "Hủy lịch hạ gói", tone: "neutral" },
  AUTO_RENEW_ENABLED: { label: "Bật tự động gia hạn", tone: "info" },
  AUTO_RENEW_DISABLED: { label: "Tắt tự động gia hạn", tone: "neutral" },
  RENEWAL_REMINDER_SENT: { label: "Gửi email nhắc gia hạn", tone: "info" },
  RENEWED: { label: "Gia hạn thành công", tone: "success" },
  RENEWAL_FAILED: { label: "Gia hạn thất bại", tone: "danger" },
  GRACE_STARTED: { label: "Bắt đầu thời gian ân hạn", tone: "warn" },
  GRACE_RECOVERED: { label: "Khôi phục sau ân hạn", tone: "success" },
  EXPIRED: { label: "Gói hết hạn", tone: "danger" },
  CANCELLED_IMMEDIATELY: { label: "Hủy gói", tone: "danger" },
  PAYMENT_METHOD_ADDED: {
    label: "Liên kết phương thức thanh toán",
    tone: "info",
  },
  PAYMENT_METHOD_REMOVED: {
    label: "Xóa phương thức thanh toán",
    tone: "neutral",
  },
};

export const TONE_CLASSES = {
  success: "bg-green-500",
  danger: "bg-red-500",
  warn: "bg-amber-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
};

// Gợi ý hành động theo mã lỗi nghiệp vụ từ backend
export const ERROR_HINTS = {
  GATEWAY_NOT_CONFIGURED:
    "Hệ thống thanh toán đang được cấu hình. Vui lòng quay lại sau.",
  GATEWAY_TIMEOUT:
    "Giao dịch chưa bị trừ tiền. Bạn có thể thử lại sau ít phút.",
  GATEWAY_ERROR:
    "Giao dịch chưa bị trừ tiền. Vui lòng thử lại hoặc chọn phương thức khác.",
  AMOUNT_TOO_LARGE: "Hãy chọn Ví MoMo cho giao dịch giá trị lớn.",
  CHANGE_NOT_ALLOWED:
    "Hãy kiểm tra lại gói hiện tại của bạn trong mục Gói của tôi.",
  CONSENT_REQUIRED:
    "Bạn cần đồng ý ủy quyền tự động gia hạn để đăng ký gói theo chu kỳ.",
};
