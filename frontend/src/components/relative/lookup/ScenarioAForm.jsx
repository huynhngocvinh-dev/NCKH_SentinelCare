import React, { useState } from "react";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../../services/api";

export default function ScenarioAForm({
  phoneNumber,
  userData,
  relativeCount = 1,
  onSubmitSuccess,
}) {
  // Mặc định xếp cuối danh sách, người dùng có thể chọn vị trí khác
  const [priority, setPriority] = useState(String(relativeCount + 1));
  const [relationship, setRelationship] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const displayName = userData?.contactName || "Tài khoản SentinelCare";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      fullName: displayName,
      activationPhone: phoneNumber.replace(/\s+/g, ""),
      relationship: relationship.trim() || "Người thân",
      priorityOrder: parseInt(priority, 10),
    };

    try {
      const res = await api.post("/emergency-contacts", payload);
      toast.success("Đã thêm người nhận cảnh báo!");
      if (onSubmitSuccess) onSubmitSuccess(res.data);
    } catch (err) {
      toast.error(err.message || "Không thể lưu người nhận cảnh báo!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Đã tìm thấy tài khoản đã đăng ký trong hệ sinh thái SentinelCare
        </span>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900">{displayName}</h4>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
              Đã xác thực
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">{phoneNumber}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mức ưu tiên:
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            {Array.from({ length: relativeCount + 1 }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  Ưu tiên {n}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mối quan hệ:{" "}
            <span className="text-slate-400 font-normal">(Tùy chọn)</span>
          </label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Vd: Con trai, Hàng xóm..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
      >
        <FiUserPlus className="w-4 h-4" />
        <span>{submitting ? "Đang lưu..." : "+ Thêm Người nhận cảnh báo"}</span>
      </button>
    </form>
  );
}
