import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import Navbar from "./components/layout/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import Register from "./pages/Register.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Login from "./pages/Login.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DeviceSetupSection from "./pages/DeviceSetupSection.jsx";
import RelativeManagementPage from "./pages/RelativeManagementPage.jsx";
import PageTitle from "./components/PageTitle.jsx";

import { IncidentModal } from "./components/layout/IncidentModal.jsx";

const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage.jsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.jsx"));
const SubscriptionManagePage = lazy(() =>
  import("./pages/SubscriptionManagePage.jsx")
);
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* NAVBAR HIỂN THỊ TOÀN CỤC */}
      <PageTitle />
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
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Gói dịch vụ */}
        <Route
          path="/bang-gia"
          element={
            <Suspense
              fallback={
                <div className="p-20 text-center text-slate-400 animate-pulse">
                  Đang tải...
                </div>
              }
            >
              <PricingPage />
            </Suspense>
          }
        />

        <Route
          path="/goi-cua-toi"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="p-20 text-center text-slate-400 animate-pulse">
                    Đang tải...
                  </div>
                }
              >
                <SubscriptionManagePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/thanh-toan/ket-qua/:invoiceId"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="p-20 text-center text-slate-400 animate-pulse">
                    Đang tải...
                  </div>
                }
              >
                <PaymentResultPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Chuyển hướng từ đường dẫn cũ sang đường dẫn mới */}
        <Route path="/pricing" element={<Navigate to="/bang-gia" replace />} />

        <Route
          path="/subscription"
          element={<Navigate to="/goi-cua-toi" replace />}
        />

        {/* Route mặc định điều hướng về Trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <IncidentModal />
    </div>
  );
}
