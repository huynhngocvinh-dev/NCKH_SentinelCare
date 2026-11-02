import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL,
  // Gửi kèm HttpOnly Cookie chứa JWT trong mọi request
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // Bắt buộc với POST/PUT/DELETE để backend chống CSRF
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Chuẩn hóa lỗi và tự đăng xuất khi phiên hết hạn (401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || "";
    const isAuthCall =
      url.includes("/auth/login") ||
      url.includes("/auth/me") ||
      url.includes("/auth/logout");

    if (status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    const message =
      err.response?.data?.message ||
      err.message ||
      "Đã có lỗi xảy ra, vui lòng thử lại.";
    // code: mã lỗi nghiệp vụ từ backend (INSUFFICIENT_FUNDS, INVALID_OTP, ...)
    const code = err.response?.data?.code;
    return Promise.reject({ ...err, message, code });
  }
);

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload),
  resendOtp: (payload) => api.post("/auth/resend-otp", payload),
  otpStatus: (email) => api.get("/auth/otp-status", { params: { email } }),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// API Quản lý Sự cố Khẩn cấp
export const incidentApi = {
  // Xác nhận sự cố (dừng leo thang cuộc gọi GSM)
  acknowledge: (id) => api.post(`/incidents/${id}/acknowledge`),
  // Lịch sử sự cố của tài khoản đang đăng nhập (có phân trang)
  getHistory: (page = 0, size = 10) =>
    api.get("/incidents/history", { params: { page, size } }),
};

// API Gói dịch vụ & thanh toán (mọi thao tác theo tài khoản đang đăng nhập)
const SUB = "/v1/subscriptions";

export const subscriptionApi = {
  getPlans: () => api.get(`${SUB}/plans`),
  getMy: () => api.get(`${SUB}/me`),
  quote: (planId) => api.get(`${SUB}/quote`, { params: { plan_id: planId } }),
  // Khởi tạo giao dịch auto-debit: trả về paymentUrl để chuyển sang MoMo
  subscribe: (payload) => api.post(`${SUB}/subscribe`, payload),
  cancelAutoRenew: (payload) => api.post(`${SUB}/cancel-auto-renew`, payload),
  resumeAutoRenew: () => api.post(`${SUB}/resume-auto-renew`),
  cancelPendingChange: () => api.delete(`${SUB}/pending-change`),
  getInvoices: (page = 0, size = 8) =>
    api.get(`${SUB}/invoices`, { params: { page, size } }),
  getInvoice: (id) => api.get(`${SUB}/invoices/${id}`),
  getPaymentMethods: () => api.get(`${SUB}/payment-methods`),
  removePaymentMethod: (id) => api.delete(`${SUB}/payment-methods/${id}`),
  getHistory: (page = 0, size = 8) =>
    api.get(`${SUB}/history`, { params: { page, size } }),
  // Tham số MoMo đính trên URL quay về (đã được MoMo ký): backend tự kiểm tra chữ ký rồi cập nhật hóa đơn
  confirmReturn: (params) => api.post("/v1/payments/return", { params }),
};

export default api;
