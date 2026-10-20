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

<<<<<<< HEAD
//Gói dịch vụ
import PricingPage from "./pages/PricingPage.jsx";
import SubscriptionManagePage from "./pages/SubscriptionManagePage.jsx";

=======
import { IncidentModal } from "./components/layout/IncidentModal.jsx";
>>>>>>> 4b4cd2f8ac1af9f4110ae989cce034923996bfb7
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

<<<<<<< HEAD
      {/* Route Dashboard được bảo vệ */}
      {/* test bỏ ngoài ,sau khi test xong bỏ vào ProtectedRouter */}
      <Route path="/cai-dat-thiet-bi" element={<DeviceSetupSection />} />
      <Route path="/nguoi-than" element={<RelativeManagementPage />} />
      
      {/* Route test Gói dịch vụ*/}
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/subscription" element={<SubscriptionManagePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
=======
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
>>>>>>> 4b4cd2f8ac1af9f4110ae989cce034923996bfb7

        {/* Route mặc định điều hướng về Trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <IncidentModal />
    </div>
  );
}