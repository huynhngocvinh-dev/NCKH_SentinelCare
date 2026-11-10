import { useEffect, useRef, useState } from "react";
import { FiClock, FiFileText } from "react-icons/fi";
import { subscriptionApi } from "../../services/api";
import { useInView, usePagedList } from "../../hooks/usePagedList";
import {
  ACTION_META,
  INVOICE_STATUS,
  TONE_CLASSES,
  formatDateTime,
  formatMoney,
} from "../../utils/subscriptionFormat";

const fetchInvoices = (page) => subscriptionApi.getInvoices(page, 8);
const fetchHistory = (page) => subscriptionApi.getHistory(page, 8);

function InvoiceList({ items }) {
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((invoice) => {
        const status = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.PENDING;
        return (
          <li
            key={invoice.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div>
              <p className="text-sm font-bold text-slate-800">
                {invoice.number} • {invoice.planName}
              </p>
              <p className="text-xs text-gray-400">
                {formatDateTime(invoice.createdAt)}
                {invoice.paymentMethodLabel
                  ? ` • ${invoice.paymentMethodLabel}`
                  : ""}
              </p>
              {invoice.status === "FAILED" && invoice.failureMessage && (
                <p className="mt-0.5 text-xs text-red-500">
                  {invoice.failureMessage}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {formatMoney(invoice.amount)}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls}`}
              >
                {status.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function HistoryTimeline({ items }) {
  return (
    <ol className="relative ml-2 space-y-5 border-l border-gray-200">
      {items.map((log) => {
        const meta = ACTION_META[log.action] || {
          label: log.action,
          tone: "neutral",
        };
        return (
          <li key={log.id} className="ml-5">
            <span
              className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full ${
                TONE_CLASSES[meta.tone]
              }`}
            />
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">
                {meta.label}
                {log.amount != null && Number(log.amount) > 0 && (
                  <span className="font-medium text-gray-500">
                    {" "}
                    • {formatMoney(log.amount)}
                  </span>
                )}
              </p>
              <span className="text-xs text-gray-400">
                {formatDateTime(log.createdAt)}
              </span>
            </div>
            {log.message && (
              <p className="mt-0.5 text-sm text-gray-500">{log.message}</p>
            )}
            <p className="mt-0.5 text-[11px] text-gray-400">
              {log.actor === "SYSTEM" ? "Hệ thống tự động" : "Bạn thực hiện"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** refreshSignal: tăng giá trị này để tải lại danh sách (sau khi có thao tác hoặc sự kiện từ server). */
export default function ActivityPanel({ refreshSignal }) {
  const [tab, setTab] = useState("invoices");
  const [visible, setVisible] = useState(false);
  const panelRef = useRef(null);
  const invoices = usePagedList(fetchInvoices);
  const history = usePagedList(fetchHistory);
  const list = tab === "invoices" ? invoices : history;

  useInView(panelRef, () => setVisible(true), !visible);

  // Bắt đầu tải khi phần này lọt vào màn hình hoặc khi đổi tab lần đầu
  useEffect(() => {
    if (visible && !list.started) list.start();
  }, [visible, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (refreshSignal > 0) {
      invoices.reload();
      history.reload();
    }
  }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabClass = (name) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
      tab === name
        ? "bg-blue-50 text-blue-600"
        : "text-gray-500 hover:bg-gray-50"
    }`;

  return (
    <div
      ref={panelRef}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("invoices")}
          className={tabClass("invoices")}
        >
          <FiFileText className="h-4 w-4" /> Hóa đơn
        </button>
        <button
          onClick={() => setTab("history")}
          className={tabClass("history")}
        >
          <FiClock className="h-4 w-4" /> Lịch sử thay đổi
        </button>
      </div>

      {!list.started || (list.loading && list.items.length === 0) ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <p className="text-sm text-gray-400">
          {tab === "invoices"
            ? "Chưa có hóa đơn nào."
            : "Chưa có thay đổi nào."}
        </p>
      ) : tab === "invoices" ? (
        <InvoiceList items={list.items} />
      ) : (
        <HistoryTimeline items={list.items} />
      )}

      {list.hasMore && (
        <button
          onClick={() => list.load(list.page + 1)}
          disabled={list.loading}
          className="mt-6 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {list.loading ? "Đang tải..." : "Xem thêm"}
        </button>
      )}
    </div>
  );
}
