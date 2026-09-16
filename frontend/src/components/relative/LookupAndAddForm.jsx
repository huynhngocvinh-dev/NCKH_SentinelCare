import React, { useState } from "react";
import { toast } from "react-toastify";
import ScenarioAForm from "./lookup/ScenarioAForm";
import ScenarioBForm from "./lookup/ScenarioBForm";
import Step1PhoneLookup from "./lookup/Step1PhoneLookup";

const isValidVietnamesePhone = (phoneStr) => {
  const cleanPhone = phoneStr.replace(/\s+/g, "");
  return /(^(0[3|5|7|8|9])+([0-9]{8})$)|(^\+84[3|5|7|8|9]+([0-9]{8})$)/.test(
    cleanPhone
  );
};

export default function LookupAndAddForm({ onAddSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeScenario, setActiveScenario] = useState("A");
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleLookup = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại người thân!");
      toast.error("Vui lòng nhập số điện thoại người thân!");
      return;
    }

    if (!isValidVietnamesePhone(phoneNumber.trim())) {
      setPhoneError("Số điện thoại không đúng định dạng!");
      toast.error("Số điện thoại không đúng định dạng Việt Nam!");
      return;
    }

    setPhoneError("");
    setSearching(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const cleanPhone = phoneNumber.replace(/\s+/g, "");
      const lastDigit = parseInt(cleanPhone.slice(-1), 10);
      const isAccountFound = !isNaN(lastDigit) && lastDigit % 2 === 0;

      setHasSearched(true);

      if (isAccountFound) {
        setActiveScenario("A");
        toast.success(
          `Đã tìm thấy tài khoản SentinelCare liên kết với số ${phoneNumber}!`
        );
      } else {
        setActiveScenario("B");
        toast.warn(
          "Số điện thoại này chưa đăng ký tài khoản! Hệ thống đã chuyển sang biểu mẫu nhập thông tin dự phòng."
        );
      }
    } catch (err) {
      toast.error("Lỗi kết nối trạm kiểm soát!");
    } finally {
      setSearching(false);
    }
  };

  const handleSuccess = (newRelative) => {
    onAddSuccess(newRelative);
    toast.success("Thêm người nhận cảnh báo thành công!");
    setHasSearched(false);
    setPhoneNumber("");
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
