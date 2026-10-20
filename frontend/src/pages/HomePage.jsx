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
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
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

      {/* Chân trang Footer */}
      <Footer />
    </div>
  );
}
