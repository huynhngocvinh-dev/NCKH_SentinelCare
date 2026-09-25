import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import Register from "./pages/Register.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DeviceSetupSection from "./pages/DeviceSetupSection.jsx";
import RelativeManagementPage from "./pages/RelativeManagementPage.jsx";

import { IncidentModal } from "./components/layout/IncidentModal.jsx";
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* NAVBAR HIỂN THỊ TOÀN CỤC */}
      <Navbar />

      {/* NỘI DUNG ROUTING */}
      <Routes>
        {/* các route công khai (Public Routes) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route path="/xac-thuc-email" element={<VerifyEmail />} />
        <Route path="/dang-nhap" element={<Login />} />

        {/* các route được bảo vệ (Protected Routes) */}
        <Route
          path="/cai-dat-thiet-bi"
          element={
            <ProtectedRoute>
              <DeviceSetupSection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nguoi-than"
          element={
            <ProtectedRoute>
              <RelativeManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lich-su"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tai-khoan"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Route mặc định điều hướng về Trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <IncidentModal />
    </div>
  );
}
