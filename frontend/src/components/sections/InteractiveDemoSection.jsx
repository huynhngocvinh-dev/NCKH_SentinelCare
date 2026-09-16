import { useState } from "react";
import { FiCheckCircle, FiAlertTriangle, FiShieldOff } from "react-icons/fi";
import { toast } from "react-toastify";
import { SCENARIOS } from "../../data/mockData";

export default function InteractiveDemoSection() {
  const [activeScenarioKey, setActiveScenarioKey] = useState("relax");
  const scenario = SCENARIOS[activeScenarioKey];

  const handleSelectScenario = (key) => {
    setActiveScenarioKey(key);
    toast.info(`Đã đổi sang ${SCENARIOS[key].title}`);
  };

  return (
    <section
      id="demo-live"
      className="py-16 bg-slate-50 border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            TRẢI NGHIỆM TƯƠNG TÁC TRỰC TIẾP
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">
            Giả Lập Tình Huống Kích Hoạt Đa Luồng
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Nhấp vào một trong các kịch bản thử nghiệm bên dưới để quan sát phản
            xa xử lý tức thì của Engine AI.
          </p>
        </div>

        {/* Scenario Switchers */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSelectScenario("relax")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeScenarioKey === "relax"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <span>🏃 Kịch Bản 1: Ngồi Thư Giãn</span>
          </button>
          <button
            onClick={() => handleSelectScenario("drop")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeScenarioKey === "drop"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <span>📢 Kịch Bản 2: Rơi Thiết Bị</span>
          </button>
          <button
            onClick={() => handleSelectScenario("fall")}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeScenarioKey === "fall"
                ? "bg-red-600 text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <span>🚨 Kịch Bản 3: Té Ngã Khẩn Cấp</span>
          </button>
        </div>

        {/* Dynamic Display Panel */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              TRẠNG THÁI IMU ĐEO TAY
            </span>
            <h4 className="font-bold text-slate-900 text-base">
              {scenario?.imuStatus}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario?.imuDesc}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              TRẠNG THÁI VISION AI CAMERA
            </span>
            <h4 className="font-bold text-slate-900 text-base">
              {scenario?.visionStatus}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario?.visionDesc}
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border space-y-2 ${
              scenario?.alertType === "danger"
                ? "bg-red-50 border-red-200 text-red-900"
                : scenario?.alertType === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              QUYẾT ĐỊNH CỦA HỆ THỐNG
            </span>
            <h4 className="font-extrabold text-base flex items-center gap-2">
              {scenario?.alertType === "danger" && (
                <FiShieldOff className="w-5 h-5 text-red-600" />
              )}
              {scenario?.alertType === "warning" && (
                <FiAlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              {scenario?.alertType === "safe" && (
                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
              )}
              {scenario?.systemDecision}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {scenario?.systemDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
