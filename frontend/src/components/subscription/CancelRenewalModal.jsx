import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import Modal from "./Modal";
import { CANCEL_REASONS } from "../../utils/subscriptionFormat";

export default function CancelRenewalModal({
  open,
  periodEndText,
  busy,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  const reasonLabel =
    CANCEL_REASONS.find((r) => r.value === reason)?.label ?? null;

  return (
    <Modal
      open={open}
      title="Hủy gia hạn?"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600 hover:bg-gray-50"
          >
            Giữ gia hạn
          </button>
          <button
            onClick={() =>
              onConfirm({
                reason: reasonLabel,
                feedback: feedback.trim() || null,
              })
            }
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy && <FiLoader className="h-4 w-4 animate-spin" />} Xác nhận hủy
          </button>
        </>
      }
    >
      <p className="mb-4 rounded-xl bg-blue-50 p-3 text-blue-900">
        Bạn vẫn có thể sử dụng quyền lợi của gói cho đến ngày{" "}
        <strong>{periodEndText}</strong>.
      </p>
      <p className="mb-2 font-bold text-slate-800">
        Vì sao bạn muốn hủy? (không bắt buộc)
      </p>
      <div className="mb-3 space-y-1.5">
        {CANCEL_REASONS.map((r) => (
          <label
            key={r.value}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="cancelReason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Góp ý thêm để chúng tôi cải thiện dịch vụ..."
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
      />
    </Modal>
  );
}
