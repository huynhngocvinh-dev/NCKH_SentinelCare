import { useState } from "react";
import { toast } from "react-toastify";
import ScenarioAForm from "./lookup/ScenarioAForm";
import ScenarioBForm from "./lookup/ScenarioBForm";
import Step1PhoneLookup from "./lookup/Step1PhoneLookup";

const API_BASE = "http://localhost:8080/api/emergency-contacts";

const isValidVietnamesePhone = (phoneStr) => {
  const cleanPhone = phoneStr.replace(/\s+/g, "");
  return /(^(0[3|5|7|8|9])+([0-9]{8})$)\vert{}(^\+84[3\vert{}5\vert{}7\vert{}8\vert{}9]+([0-9]{8})$)/.test(
    cleanPhone
  );
};

export default function LookupAndAddForm({ onAddSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeScenario, setActiveScenario] = useState("A");
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [foundUserData, setFoundUserData] = useState(null);

  const handleLookup = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại người thân!");
      toast.error("Vui lòng nhập số điện thoại người thân!");
      return;
    }

    if (!isValidVietnamesePhone(phoneNumber.trim())) {
      setPhoneError("Số điện thoại không đúng định dạng Việt Nam!");
      toast.error("Số điện thoại không đúng định dạng!");
      return;
    }

    setPhoneError("");
    setSearching(true);

    try {
      const cleanPhone = phoneNumber.replace(/\s+/g, "");
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/check-phone?phone=${encodeURIComponent(cleanPhone)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setHasSearched(true);

      if (res.ok) {
        const data = await res.json();
        setFoundUserData(data);
        setActiveScenario("A");
        toast.success(`Đã tìm thấy tài khoản liên kết với số ${cleanPhone}!`);
      } else if (res.status === 404) {
        setFoundUserData(null);
        setActiveScenario("B");
        toast.warn("Số điện thoại này chưa đăng ký tài khoản!");
      } else {
        throw new Error("Lỗi hệ thống khi tra cứu!");
      }
    } catch (err) {
      toast.error("Không thể kết nối tới máy chủ Backend (Spring Boot)!");
    } finally {
      setSearching(false);
    }
  };

  const handleSuccess = (newRelative) => {
    onAddSuccess(newRelative);
    setHasSearched(false);
    setPhoneNumber("");
    setFoundUserData(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            QUY TRÌNH 2 BƯỚC TỰ ĐỘNG
          </span>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Smart Auto-Lookup
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 mt-0.5">
          Tra Cứu & Thêm Người Nhận Cảnh Báo
        </h3>
        <p className="text-xs text-slate-500">
          Nhập số điện thoại để hệ thống rà soát tài khoản SentinelCare. Nếu
          chưa có, biểu mẫu tự động mở rộng để nhập thông tin cứu hộ dự phòng.
        </p>
      </div>

      <Step1PhoneLookup
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        onLookup={handleLookup}
        searching={searching}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        activeScenario={activeScenario}
        hasSearched={hasSearched}
        onForceScenario={(sc) => {
          setActiveScenario(sc);
          setHasSearched(true);
        }}
      />

      {hasSearched && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Bước 2: Kết Quả Xác Thực & Phê Duyệt Kênh Cảnh Báo</span>
          </div>

          {activeScenario === "A" ? (
            <ScenarioAForm
              phoneNumber={phoneNumber}
              userData={foundUserData}
              onSubmitSuccess={handleSuccess}
            />
          ) : (
            <ScenarioBForm
              initialPhone={phoneNumber}
              onSubmitSuccess={handleSuccess}
            />
          )}
        </div>
      )}
    </div>
  );
}
