import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiLogIn, FiUserPlus, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useBidirectionalMotion } from "../hooks/useBidirectionalMotion";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import PainPointsSection from "../components/sections/PainPointsSection";
import ArchitectureSection from "../components/sections/ArchitectureSection";
import GracePeriodSimulator from "../components/sections/GracePeriodSimulator";
import EscalationProcessSection from "../components/sections/EscalationProcessSection";
import ComparisonTableSection from "../components/sections/ComparisonTableSection";
import InteractiveDemoSection from "../components/sections/InteractiveDemoSection";
import ContactFormSection from "../components/sections/ContactFormSection";

export default function HomePage() {
  useBidirectionalMotion();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isLoggedIn = isAuthenticated || Boolean(user);

  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#071a36] antialiased selection:bg-[#1469db] selection:text-white overflow-x-clip">
      {/* Floating Glass Header — chỉ hiển thị khi chưa đăng nhập */}
      {!isLoggedIn && (
        <header className="fixed top-3.5 left-3.5 right-3.5 sm:left-5 sm:right-5 z-40 h-16 px-5 sm:px-7 rounded-[18px] border border-white/25 bg-[#062249]/75 backdrop-blur-xl shadow-[0_12px_40px_rgba(2,22,49,0.28)] text-white flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => goTo("giai-phap")}
            className="inline-flex items-center gap-2.5 text-base sm:text-lg font-semibold tracking-[3px] cursor-pointer"
          >
            <FiActivity className="w-5 h-5 text-[#72f1ce]" />
            <span>
              SENTINEL
              <i className="not-italic font-light text-[#8de6f7]">CARE</i>
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[11px] tracking-[1px] uppercase font-medium">
            <button
              onClick={() => goTo("thuc-trang")}
              className="hover:text-[#8de6f7] transition cursor-pointer"
            >
              Thực trạng
            </button>
            <button
              onClick={() => goTo("cong-nghe")}
              className="hover:text-[#8de6f7] transition cursor-pointer"
            >
              Kiến trúc AI
            </button>
            <button
              onClick={() => goTo("grace-period")}
              className="hover:text-[#8de6f7] transition cursor-pointer"
            >
              Grace 25s
            </button>
            <button
              onClick={() => goTo("demo-live")}
              className="hover:text-[#8de6f7] transition cursor-pointer"
            >
              Demo trực tiếp
            </button>
            <button
              onClick={() => goTo("dang-ky-tu-van")}
              className="hover:text-[#8de6f7] transition cursor-pointer"
            >
              Liên hệ
            </button>
          </nav>

          {/* Auth Buttons (Đăng nhập & Đăng ký nổi bật hơn) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/dang-nhap")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <FiLogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>

            <button
              onClick={() => navigate("/dang-ky")}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold tracking-wide text-white bg-gradient-to-r from-[#1469db] via-[#1d8cf8] to-[#38bdf8] border border-sky-200/60 shadow-[0_6px_22px_rgba(56,189,248,0.45)] -translate-y-0.5 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(56,189,248,0.65)] transition-all cursor-pointer"
            >
              <FiUserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="md:hidden p-1.5 text-white cursor-pointer"
          >
            {menuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>

          {/* Mobile Dropdown */}
          {menuOpen && (
            <div className="md:hidden absolute top-[72px] left-0 right-0 p-5 rounded-[18px] bg-[#051f44]/95 backdrop-blur-xl border border-white/15 flex flex-col gap-3 text-xs tracking-wider uppercase shadow-2xl">
              <button
                onClick={() => goTo("thuc-trang")}
                className="text-left py-1.5"
              >
                Thực trạng y tế
              </button>
              <button
                onClick={() => goTo("cong-nghe")}
                className="text-left py-1.5"
              >
                Kiến trúc đa luồng
              </button>
              <button
                onClick={() => goTo("grace-period")}
                className="text-left py-1.5"
              >
                Mô phỏng 25s
              </button>
              <button
                onClick={() => goTo("demo-live")}
                className="text-left py-1.5"
              >
                Demo tình huống
              </button>

              <div className="pt-3 mt-1 border-t border-white/15 flex flex-col gap-2.5 normal-case">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/dang-nhap");
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <FiLogIn className="w-4 h-4" /> Đăng nhập
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/dang-ky");
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1469db] to-[#38bdf8] border border-sky-200/50 text-white font-bold shadow-[0_6px_20px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2"
                >
                  <FiUserPlus className="w-4 h-4" /> Đăng ký ngay
                </button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Nội dung chính Landing Page */}
      <main>
        <HeroSection />
        <PainPointsSection />
        <ArchitectureSection />
        <GracePeriodSimulator />
        <EscalationProcessSection />
        <ComparisonTableSection />
        <InteractiveDemoSection />
        <ContactFormSection />
      </main>

      <Footer />
    </div>
  );
}
