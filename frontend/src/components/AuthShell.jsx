import { FiShield, FiCheckCircle } from "react-icons/fi";

export default function AuthShell({
  leftContent,
  children,
  footerNote = "FDA CLASS II CLEARED TELECARE ARCHITECTURE",
}) {
  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] flex flex-col justify-between font-sans">
      {/* Main Container */}
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex items-center">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (Medical UI Cards & Telemetry) */}
          <div className="lg:col-span-7 space-y-6">{leftContent}</div>

          {/* Right Column (Form Card) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100/80">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer Bar */}
      <footer className="w-full border-t border-slate-200/60 bg-white py-3 px-6 text-[11px] font-semibold text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2 text-slate-600 font-mono tracking-wider">
          <FiShield className="w-4 h-4 text-blue-600" />
          <span>{footerNote}</span>
        </div>
        <div className="flex items-center gap-6">
          <span>
            © {new Date().getFullYear()} SentinelCare AI Medical Systems Inc.
          </span>
          <a href="#privacy" className="hover:text-blue-600 transition-colors">
            Privacy & Telehealth Consent
          </a>
          <a
            href="#protocols"
            className="hover:text-blue-600 transition-colors"
          >
            Emergency Protocols
          </a>
        </div>
      </footer>
    </div>
  );
}
