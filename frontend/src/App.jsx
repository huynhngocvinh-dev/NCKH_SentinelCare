import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import Register from "./pages/Register.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DeviceSetupSection from "./pages/DeviceSetupSection.jsx";
import RelativeManagementPage from "./pages/RelativeManagementPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Route Trang chủ SentinelCare */}
      <Route path="/" element={<HomePage />} />

      {/* Các Route xác thực & hệ thống */}
      <Route path="/dang-ky" element={<Register />} />
      <Route path="/xac-thuc-email" element={<VerifyEmail />} />
      <Route path="/dang-nhap" element={<Login />} />

      {/* Route Dashboard được bảo vệ */}
      {/* test bỏ ngoài ,sau khi test xong bỏ vào ProtectedRouter */}
      <Route path="/cai-dat-thiet-bi" element={<DeviceSetupSection />} />
      <Route path="/nguoi-than" element={<RelativeManagementPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Route mặc định điều hướng về Trang chủ hoặc Đăng nhập */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
