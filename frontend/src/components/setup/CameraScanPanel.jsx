import React, { useState, useEffect, useRef } from "react";
import { FiInfo, FiCamera } from "react-icons/fi";
import { HiQrCode } from "react-icons/hi2";
import { toast } from "react-toastify";
import { Html5Qrcode } from "html5-qrcode";

export default function CameraScanPanel({ onApplySerial }) {
  const [identifyMethod, setIdentifyMethod] = useState("qr"); // 'qr' | 'manual'
  const [manualSerialInput, setManualSerialInput] = useState("");
  const [isScanningWebcam, setIsScanningWebcam] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const html5QrCodeRef = useRef(null);

  // Tự động tắt luồng Webcam khi unmount hoặc chuyển tab
  useEffect(() => {
    return () => {
      stopWebcamScanner();
    };
  }, []);

  // 🔍 HÀM VALIDATE CHUẨN MÃ CAMERA SENTINELCARE
  const validateCameraQrCode = (rawText) => {
    if (!rawText) return { valid: false, message: "Mã QR không hợp lệ!" };

    const text = rawText.trim();

    // Quy định 1: Định dạng JSON Payload (Tem mã hóa y tế)
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        const data = JSON.parse(text);
        if (data.type === "CAMERA" && data.serial) {
          return { valid: true, serial: data.serial.toUpperCase() };
        }
      } catch (e) {
        // Khối catch xử lý chuỗi không phải JSON
      }
    }

    // Quy định 2: Chuỗi Serial tiêu chuẩn (Bắt đầu bằng CAM- hoặc CAM-AI-)
    const cameraSerialRegex = /^CAM-(AI-)?[A-Z0-9-]{4,20}$/i;

    if (cameraSerialRegex.test(text)) {
      return { valid: true, serial: text.toUpperCase() };
    }

    return {
      valid: false,
      message:
        "Mã QR không hợp lệ! Vui lòng quét đúng mã Camera SentinelCare (Định dạng chuẩn: CAM-AI-XXXXX-VN).",
    };
  };

  // Mở Webcam laptop để quét mã QR thực tế
  const startWebcamScanner = async () => {
    setIsScanningWebcam(true);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 180, height: 180 } },
        (decodedText) => {
          // Kiểm tra tính hợp lệ của mã QR vừa quét
          const checkResult = validateCameraQrCode(decodedText);

          if (checkResult.valid) {
            onApplySerial(checkResult.serial);
            toast.success(
              `Đã quét QR Camera thành công: ${checkResult.serial}`
            );
            stopWebcamScanner();
          } else {
            toast.error(checkResult.message);
          }
        },
        () => {
          // Bỏ qua log khi chưa phát hiện mã QR trong khung hình
        }
      );
    } catch (err) {
      toast.error("Không thể mở Webcam hoặc bị từ chối quyền truy cập!");
      setIsScanningWebcam(false);
    }
  };

  // Dừng luồng Webcam
  const stopWebcamScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current.clear();
          setIsScanningWebcam(false);
        })
        .catch(() => setIsScanningWebcam(false));
    } else {
      setIsScanningWebcam(false);
    }
  };

  // Giả lập quét QR (Dev mode test nhanh)
  const handleSimulateQRScan = () => {
    setIsSimulatingScan(true);
    toast.info("Đang thử nghiệm quét QR...");

    setTimeout(() => {
      const simulatedRawCode = `CAM-AI-${Math.floor(
        10000 + Math.random() * 90000
      )}-VN`;

      const checkResult = validateCameraQrCode(simulatedRawCode);
      if (checkResult.valid) {
        onApplySerial(checkResult.serial);
        toast.success(
          `Đã quét QR thành công! Mã Serial: ${checkResult.serial}`
        );
      } else {
        toast.error(checkResult.message);
      }
      setIsSimulatingScan(false);
    }, 1200);
  };

  // Áp dụng mã khi nhập thủ công
  const handleApplyManual = () => {
    const checkResult = validateCameraQrCode(manualSerialInput);

    if (!checkResult.valid) {
      toast.error(checkResult.message);
      return;
    }

    onApplySerial(checkResult.serial);
    toast.success(`Đã áp dụng mã Serial: ${checkResult.serial}`);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <HiQrCode className="w-4 h-4 text-blue-600" /> Phương thức nhận diện
        </span>

        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => setIdentifyMethod("qr")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              identifyMethod === "qr"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Quét QR Code
          </button>
          <button
            type="button"
            onClick={() => {
              stopWebcamScanner();
              setIdentifyMethod("manual");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              identifyMethod === "manual"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Nhập mã ID
          </button>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: QUÉT QR CODE */}
      {identifyMethod === "qr" && (
        <div className="bg-slate-900 rounded-2xl min-h-[260px] relative overflow-hidden flex flex-col items-center justify-center p-4 border border-slate-800">
          <div
            id="reader"
            className={`w-full max-w-[240px] rounded-xl overflow-hidden ${
              isScanningWebcam ? "block" : "hidden"
            }`}
          />

          {!isScanningWebcam && (
            <div className="w-44 h-44 border-2 border-blue-500/40 rounded-xl relative flex items-center justify-center mb-2">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500" />
              <HiQrCode className="w-16 h-16 text-slate-700 opacity-60" />
            </div>
          )}

          <p className="text-[11px] text-slate-300 mt-2 font-medium text-center">
            {isScanningWebcam
              ? "Đang bật Webcam... Đưa mã QR Camera (VD: CAM-AI-XXXXX-VN) vào khung hình"
              : "Đặt mã QR in dưới đáy camera vào khung hình"}
          </p>

          <div className="flex gap-2 mt-3">
            {!isScanningWebcam ? (
              <button
                type="button"
                onClick={startWebcamScanner}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <FiCamera className="w-3.5 h-3.5" />
                Quét
              </button>
            ) : (
              <button
                type="button"
                onClick={stopWebcamScanner}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer"
              >
                Tắt Webcam
              </button>
            )}

            <button
              type="button"
              onClick={handleSimulateQRScan}
              disabled={isSimulatingScan || isScanningWebcam}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Quét giả lập
            </button>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: NHẬP MÃ ID THỦ CÔNG */}
      {identifyMethod === "manual" && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Mã Seri thủ công hoặc Serial Barcode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualSerialInput}
              onChange={(e) => setManualSerialInput(e.target.value)}
              placeholder="CAM-AI-99428-VN"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={handleApplyManual}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Tìm thấy trên tem dán chứng nhận bảo hành hoặc bao bì sản phẩm (Định
            dạng: CAM-AI-XXXXX-VN).
          </p>
        </div>
      )}

      {/* Thông báo băng tần Wi-Fi */}
      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
        <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span className="leading-snug">
          Đảm bảo điện thoại hoặc trạm kết nối đang ở cùng mạng Wi-Fi băng tần
          kép 2.4GHz / 5GHz với thiết bị giám sát góc rộng.
        </span>
      </div>
    </div>
  );
}
