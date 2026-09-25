import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request if present
api.interceptors.request.use((config) => {
  // Ưu tiên lấy từ fg_access_token, dự phòng lấy từ fg_user
  let token = localStorage.getItem("fg_access_token");
  if (!token) {
    try {
      const fgUser = JSON.parse(localStorage.getItem("fg_user") || "{}");
      token = fgUser.token || fgUser.accessToken;
    } catch (e) {
      token = null;
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages so components can just read err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Đã có lỗi xảy ra, vui lòng thử lại.";
    return Promise.reject({ ...err, message });
  }
);

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload),
  resendOtp: (payload) => api.post("/auth/resend-otp", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
};

// API Quản lý Sự cố Khẩn cấp
export const incidentApi = {
  // Xác nhận sự cố (Ngắt đếm ngược 60s gọi GSM)
  acknowledge: (id) => api.post(`/incidents/${id}/acknowledge`),
  // Lấy lịch sử sự cố
  getHistory: () => api.get("/incidents/history"),
};

export default api;