import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiLoader,
} from "react-icons/fi";
import { subscriptionApi } from "../services/api";
import { useSubscription } from "../hooks/useSubscription";
import { useSubscriptionPush } from "../hooks/useSubscriptionPush";
import { formatDate, formatMoney } from "../utils/subscriptionFormat";

const MAX_POLLS = 30; // 30 lần x 2 giây = 1 phút

export default function PaymentResultPage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const { subscription, refresh } = useSubscription();

  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const [pollKey, setPollKey] = useState(0); // tăng lên để kiểm tra lại ngay

  const id = Number(invoiceId) || null;
  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  // Server đẩy sự kiện (thanh toán xong / thất bại): kiểm tra lại ngay
  useSubscriptionPush(() => setPollKey((k) => k + 1));

  // Các tham số trên URL quay về do MoMo ký: gửi backend xác thực chữ ký rồi cập nhật hóa đơn.
  // Backend xử lý một lần duy nhất cho mỗi hóa đơn nên gọi lặp với IPN cũng không bị trừ trùng.
  useEffect(() => {
    if (!params.vnp_SecureHash) return;
    let cancelled = false;
    subscriptionApi
      .confirmReturn(params)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPollKey((k) => k + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  // Theo dõi trạng thái hóa đơn
  useEffect(() => {
    if (!id) {
      setError("Không xác định được giao dịch cần kiểm tra.");
      return;
    }
    let cancelled = false;
    let timer;
    let attempts = 0;

    const poll = async () => {
      try {
        const { data } = await subscriptionApi.getInvoice(id);
        if (cancelled) return;
        setInvoice(data);

        if (data.status === "PENDING") {
          attempts += 1;
          if (attempts >= MAX_POLLS) {
            setTimedOut(true);
            return;
          }
          timer = setTimeout(poll, 2000);
        } else if (data.status === "PAID") {
          refresh(); // lấy gói mới để mở khóa tính năng trên giao diện
        }
      } catch (err) {
        if (!cancelled)
          setError(err.message || "Không thể kiểm tra giao dịch.");
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, pollKey, refresh]);

  const status = invoice?.status;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        {error ? (
          <>
            <FiAlertTriangle className="mx-auto mb-4 h-14 w-14 text-red-500" />
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">
              Không thể kiểm tra giao dịch
            </h1>
            <p className="mb-6 text-sm text-gray-500">{error}</p>
            <Link
              to="/goi-cua-toi"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
            >
              Xem gói của tôi
            </Link>
          </>
        ) : !invoice || (status === "PENDING" && !timedOut) ? (
          <>
            <FiLoader className="mx-auto mb-4 h-14 w-14 animate-spin text-blue-500" />
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">
              Đang xác nhận giao dịch...
            </h1>
            <p className="text-sm text-gray-500">
              Vui lòng không đóng trang. Quá trình này thường mất vài giây.
            </p>
          </>
        ) : status === "PAID" ? (
          <>
            <FiCheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500" />
            <h1 className="mb-2 text-2xl font-extrabold text-slate-900">
              Cảm ơn bạn!
            </h1>
            <p className="mb-1 text-sm text-gray-600">
              Gói <strong>{invoice.planName}</strong> đã được kích hoạt.
            </p>
            <p className="mb-5 text-xs text-gray-500">
              {invoice.number} • {formatMoney(invoice.amount)}
              {invoice.paymentMethodLabel
                ? ` • ${invoice.paymentMethodLabel}`
                : ""}
            </p>

            {subscription?.features?.length > 0 && (
              <div className="mb-5 rounded-2xl bg-green-50 p-4 text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-700">
                  Tính năng đã được mở khóa
                </p>
                <ul className="space-y-1.5">
                  {subscription.features.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 text-sm text-green-900"
                    >
                      <FiCheck className="h-4 w-4 shrink-0" /> {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {subscription?.autoRenew && subscription.currentPeriodEnd && (
              <p className="mb-5 text-xs text-gray-500">
                Đến ngày {formatDate(subscription.currentPeriodEnd)} bạn sẽ được
                nhắc gia hạn. Bạn có thể hủy gia hạn bất kỳ lúc nào trong mục
                Gói của tôi.
                {formatDate(subscription.currentPeriodEnd)}. Bạn có thể hủy bất
                kỳ lúc nào trong mục Gói của tôi.
              </p>
            )}

            <Link
              to="/goi-cua-toi"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Xem gói của tôi
            </Link>
          </>
        ) : status === "PENDING" ? (
          <>
            <FiClock className="mx-auto mb-4 h-14 w-14 text-amber-500" />
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">
              Đang chờ MoMo xác nhận
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              Chúng tôi chưa nhận được kết quả cuối cùng. Nếu tài khoản của bạn
              đã bị trừ tiền, gói sẽ tự được kích hoạt ngay khi MoMo xác nhận.
              Bạn có thể xem lại trong mục Gói của tôi.
            </p>
            <Link
              to="/goi-cua-toi"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
            >
              Xem gói của tôi
            </Link>
          </>
        ) : (
          <>
            <FiAlertTriangle className="mx-auto mb-4 h-14 w-14 text-red-500" />
            <h1 className="mb-2 text-xl font-extrabold text-slate-900">
              Thanh toán không thành công
            </h1>
            <p className="mb-1 text-sm font-medium text-red-600">
              {invoice.failureMessage || "Giao dịch không được hoàn tất."}
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Bạn chưa bị trừ tiền cho giao dịch này. Có thể thử lại bằng cùng
              hoặc phương thức khác.
            </p>
            <Link
              to="/bang-gia"
              className="inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
            >
              Thử lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
