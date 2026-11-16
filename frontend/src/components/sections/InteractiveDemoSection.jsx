// InteractiveDemoSection.jsx
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
    <section id="demo-live" className="py-24 bg-[#eaf3ff]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 space-y-8">
        <div className="reveal">
          <span className="text-[10px] tracking-[2.2px] uppercase text-[#1469db] font-bold">
            06 — TRẢI NGHIỆM TƯƠNG TÁC TRỰC TIẾP
          </span>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#071a36] mt-2 leading-[1.05]">
            Giả lập tình huống{" "}
            <em className="text-[#1469db] italic">đối soát đa luồng.</em>
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Chọn một kịch bản thử nghiệm bên dưới để quan sát phản xạ xử lý chéo
            giữa IMU và Vision AI.
          </p>
        </div>

        {/* Scenario Switchers */}
        <div className="flex flex-wrap gap-3 reveal delay-1">
          {[
            { key: "relax", label: "Kịch Bản 1: Ngồi Thư Giãn" },
            { key: "drop", label: "Kịch Bản 2: Rơi Thiết Bị" },
            { key: "fall", label: "Kịch Bản 3: Té Ngã Khẩn Cấp", danger: true },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleSelectScenario(btn.key)}
              className={`px-5 py-3.5 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeScenarioKey === btn.key
                  ? btn.danger
                    ? "bg-rose-600 text-white shadow-lg"
                    : "bg-[#071a36] text-white shadow-lg"
                  : "bg-white text-[#071a36] border border-[#125bae]/15 hover:bg-blue-50"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Dynamic Display Panel */}
        <div className="grid md:grid-cols-3 gap-6 reveal delay-2">
          <div className="bg-white p-7 rounded-[26px] border border-[#125bae]/10 shadow-sm space-y-2.5">
            <span className="text-[10px] font-bold tracking-[1.5px] text-slate-400 uppercase">
              LUỒNG 1 • IMU ĐEO TAY
            </span>
            <h4 className="font-bold text-[#071a36] text-base">
              {scenario?.imuStatus}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario?.imuDesc}
            </p>
          </div>

          <div className="bg-white p-7 rounded-[26px] border border-[#125bae]/10 shadow-sm space-y-2.5">
            <span className="text-[10px] font-bold tracking-[1.5px] text-slate-400 uppercase">
              LUỒNG 2 • VISION EDGE AI
            </span>
            <h4 className="font-bold text-[#071a36] text-base">
              {scenario?.visionStatus}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario?.visionDesc}
            </p>
          </div>

          <div
            className={`p-7 rounded-[26px] border space-y-2.5 transition-colors ${
              scenario?.alertType === "danger"
                ? "bg-rose-50 border-rose-200 text-rose-950"
                : scenario?.alertType === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-emerald-50 border-emerald-200 text-emerald-950"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] opacity-75">
              QUYẾT ĐỊNH CỦA HỆ THỐNG
            </span>
            <h4 className="font-extrabold text-base flex items-center gap-2">
              {scenario?.alertType === "danger" && (
                <FiShieldOff className="w-5 h-5 text-rose-600" />
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
