import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import api from "../services/api";
import RelativeHeader from "../components/relative/RelativeHeader";
import EscalationMechanism from "../components/relative/EscalationMechanism";
import RelativeList from "../components/relative/RelativeList";
import LookupAndAddForm from "../components/relative/LookupAndAddForm";
import GeneralSettings from "../components/relative/GeneralSettings";

export default function RelativeManagementPage() {
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRelatives = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/emergency-contacts");
      setRelatives(res.data);
    } catch (err) {
      toast.error(
        err.message || "Không thể tải danh sách người thân từ hệ thống."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatives();
  }, []);

  // Đổi vị trí 1 người lên (-1) hoặc xuống (+1), lưu thứ tự mới lên server
  const handleMove = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= relatives.length) return;

    const next = [...relatives];
    [next[index], next[target]] = [next[target], next[index]];
    setRelatives(next);

    try {
      await api.put("/emergency-contacts/reorder", {
        orderedIds: next.map((r) => r.id),
      });
      fetchRelatives(true);
    } catch (err) {
      toast.error(err.message || "Không thể đổi thứ tự ưu tiên!");
      fetchRelatives(true);
    }
  };

  const handleDelete = async (relative) => {
    if (!window.confirm(`Xóa ${relative.contactName} khỏi danh sách?`)) return;
    try {
      await api.delete(`/emergency-contacts/${relative.id}`);
      toast.success("Đã xóa người thân.");
      fetchRelatives(true);
    } catch (err) {
      toast.error(err.message || "Không thể xóa người thân!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <RelativeHeader />
        <EscalationMechanism />

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium animate-pulse">
                ⏳ Đang tải danh sách người thân...
              </div>
            ) : (
              <RelativeList
                relatives={relatives}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            )}
          </div>

          <div className="lg:col-span-5">
            <LookupAndAddForm
              relativeCount={relatives.length}
              onAddSuccess={() => fetchRelatives(true)}
            />
          </div>
        </div>

        <GeneralSettings />
      </div>
    </div>
  );
}
