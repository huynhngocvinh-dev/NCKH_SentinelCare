export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  busy = false,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-xl font-extrabold text-slate-900">{title}</h3>
        <div className="mb-6 text-sm leading-relaxed text-gray-600">
          {children}
        </div>
        <div className="flex gap-3">{footer}</div>
      </div>
    </div>
  );
}
