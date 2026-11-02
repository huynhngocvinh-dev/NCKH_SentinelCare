import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "SentinelCare";

const PAGE_TITLES = {
  "/": `${APP_NAME} - Hệ thống cảnh báo té ngã`,
  "/dang-ky": "Đăng ký",
  "/xac-thuc-email": "Xác thực email",
  "/dang-nhap": "Đăng nhập",
  "/cai-dat-thiet-bi": "Cài đặt thiết bị",
  "/nguoi-than": "Quản lý người thân",
  "/lich-su": "Lịch sử sự cố",
  "/tai-khoan": "Tài khoản",
  "/bang-gia": "Dịch Vụ",
  "/goi-cua-toi": "Gói Của Tôi",
  "/thanh-toan/ket-qua": "thanh toán",
};

export default function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Bỏ dấu "/" thừa ở cuối đường dẫn (trừ trang chủ)
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    // Khớp đúng đường dẫn, hoặc tiền tố cho các trang có tham số
    const key = Object.keys(PAGE_TITLES).find(
      (k) => path === k || (k !== "/" && path.startsWith(k + "/"))
    );
    const pageTitle = key ? PAGE_TITLES[key] : undefined;

    if (!pageTitle) {
      document.title = APP_NAME;
    } else if (path === "/") {
      document.title = pageTitle;
    } else {
      document.title = `${pageTitle} | ${APP_NAME}`;
    }
  }, [pathname]);

  return null;
}
