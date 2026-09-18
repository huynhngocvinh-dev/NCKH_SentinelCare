import { useState, useEffect } from "react";
import { FiVideo, FiRadio, FiCheck, FiWatch } from "react-icons/fi";
import { toast } from "react-toastify";

import HeaderBar from "../components/setup/HeaderBar";
import HardwareStatusGrid from "../components/setup/HardwareStatusGrid";
import WearableForm from "../components/setup/WearableForm";
import CameraScanPanel from "../components/setup/CameraScanPanel";
import CameraForm from "../components/setup/CameraForm";
import ConfiguredDevicesList from "../components/setup/ConfiguredDevicesList";
import api from "../services/api";

const INITIAL_FOUND_DEVICES = [
  {
    id: "FG-2024-00123-PRO",
    name: "FallGuard 3D Pro",
    rssi: -42,
    signalText: "Tín hiệu rất tốt",
    battery: 96,
  },
  {
    id: "FG-2026-88219-PRO",
    name: "FallGuard Pro Medical Band v3",
    rssi: -68,
    signalText: "Tín hiệu trung bình",
    battery: 82,
  },
];

export default function DeviceSetupSection() {
  const [activeTab, setActiveTab] = useState("camera");

  // Wearable State
  const [wearableData, setWearableData] = useState({
    serialNumber: "",
    subjectFullName: "",
    subjectGender: "",
    subjectDob: "",
    medicalHistory: "",
    wearPosition: "",
  });
  const [wearableErrors, setWearableErrors] = useState({});

  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState(INITIAL_FOUND_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Camera State
  const [cameraData, setCameraData] = useState({
    cameraName: "",
    serialNumber: "",
    roomLocation: "",
    cameraAngle: "",
    enableTwoWayIntercom: true,
  });
  const [cameraErrors, setCameraErrors] = useState({});

  const [configuredDevices, setConfiguredDevices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  // 🟢 1. LẤY DANH SÁCH THIẾT BỊ TỪ BACKEND
  const fetchDevices = async () => {
    try {
      const res = await api.get("/devices");
      setConfiguredDevices(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách thiết bị:", err);
      // Không tự ý set mock data ở đây để đảm bảo giao diện phản ánh đúng CSDL
    }
  };

  const handleWearableChange = (field, value) => {
    setWearableData((prev) => ({ ...prev, [field]: value }));
    if (wearableErrors[field]) {
      setWearableErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCameraChange = (field, value) => {
    setCameraData((prev) => ({ ...prev, [field]: value }));
    if (cameraErrors[field]) {
      setCameraErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleApplyCameraSerial = (serial) => {
    handleCameraChange("serialNumber", serial);
  };

  const handleSelectDevice = (device) => {
    setSelectedDeviceId(device.id);
    handleWearableChange("serialNumber", device.id);
    toast.info(`Đã chọn thiết bị: ${device.name}`);
  };

  const handleScanBluetooth = async () => {
    setIsScanning(true);
    try {
      if (!navigator.bluetooth) {
        toast.error("Trình duyệt không hỗ trợ Web Bluetooth API!");
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      const newDevice = {
        id: device.id || `FG-BLE-${Math.floor(1000 + Math.random() * 9000)}`,
        name: device.name || "FallGuard BLE Device",
        rssi: -45,
        signalText: "Tín hiệu rất tốt",
        battery: 100,
      };

      setScannedDevices((prev) => [newDevice, ...prev]);
      handleSelectDevice(newDevice);
      toast.success(`Đã tìm thấy thiết bị: ${newDevice.name}`);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        // Không báo lỗi nếu người dùng tự hủy chọn
        toast.error("Lỗi khi kết nối Bluetooth!");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const validateWearable = () => {
    const errors = {};
    if (!wearableData.serialNumber.trim())
      errors.serialNumber = "Mã Serial là bắt buộc";
    if (!wearableData.subjectFullName.trim())
      errors.subjectFullName = "Họ tên người được giám sát là bắt buộc";
    if (!wearableData.subjectDob) errors.subjectDob = "Ngày sinh là bắt buộc";
    setWearableErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCamera = () => {
    const errors = {};
    if (!cameraData.cameraName.trim())
      errors.cameraName = "Tên camera là bắt buộc";
    if (!cameraData.serialNumber.trim())
      errors.serialNumber = "Mã Serial camera là bắt buộc";
    setCameraErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWearableSubmit = async (e) => {
    e.preventDefault();
    if (!validateWearable()) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/devices/wearable", wearableData);
      toast.success(res.data?.message || "Ghép nối thiết bị đeo thành công!");

      // Reset form sau khi gửi thành công
      setWearableData({
        serialNumber: "",
        subjectFullName: "",
        subjectGender: "",
        subjectDob: "",
        medicalHistory: "",
        wearPosition: "",
      });
      setSelectedDeviceId("");
      fetchDevices(); // Load lại danh sách thiết bị thực từ server
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Ghép nối thất bại!";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCameraSubmit = async (e) => {
    e.preventDefault();
    if (!validateCamera()) {
      toast.error("Vui lòng điền thông tin Camera!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/devices/camera", cameraData);
      toast.success(res.data?.message || "Lưu Camera thành công!");

      // Reset form camera sau khi lưu thành công
      setCameraData({
        cameraName: "",
        serialNumber: "",
        roomLocation: "",
        cameraAngle: "",
        enableTwoWayIntercom: true,
      });
      fetchDevices(); // Load lại danh sách thiết bị thực từ server
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Kích hoạt Camera thất bại!";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <HeaderBar />

        {/* Tab Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("camera")}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FiVideo className="w-4 h-4" />
            <span>KẾT NỐI CAMERA AI</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-mono">
              QR / RTSP
            </span>
          </button>

          <button
            onClick={() => setActiveTab("wearable")}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "wearable"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FiRadio className="w-4 h-4" />
            <span>KẾT NỐI THIẾT BỊ ĐEO IOT</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-mono">
              BLE 5.3
            </span>
          </button>
        </div>

        {/* Tab 1: Wearable */}
        {activeTab === "wearable" && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-2 text-blue-600">
                    <FiRadio className="w-4 h-4" /> Radar Bluetooth BLE
                  </span>
                  <span className="text-slate-400 font-mono">
                    2.402 - 2.480 GHZ
                  </span>
                </div>

                <div className="bg-slate-900 rounded-2xl h-56 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center z-10 shadow-lg shadow-blue-500/50">
                    <FiRadio className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="bg-white text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full mt-4 z-10 shadow">
                    • FallGuard 3D Pro
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2 z-10">
                    Đang dò tìm thiết bị FallGuard Bluetooth BLE gần đây...
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                    THIẾT BỊ KHẢ DỤNG TRONG PHẠM VI 10M:
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {scannedDevices.map((dev) => {
                      const isSelected =
                        selectedDeviceId === dev.id ||
                        wearableData.serialNumber === dev.id;
                      return (
                        <div
                          key={dev.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-50/60 border-blue-500"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                              <FiWatch className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">
                                {dev.name}
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                RSSI: {dev.rssi}dBm • {dev.signalText} (Pin{" "}
                                {dev.battery}%)
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectDevice(dev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-sm flex items-center gap-1"
                                : "bg-white text-blue-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <FiCheck className="w-3.5 h-3.5" /> Đã chọn
                              </>
                            ) : (
                              "Chọn"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <HardwareStatusGrid />
              </div>
            </div>

            <div className="lg:col-span-7">
              <WearableForm
                formData={wearableData}
                errors={wearableErrors}
                onChange={handleWearableChange}
                onScanBluetooth={handleScanBluetooth}
                isScanning={isScanning}
                onSubmit={handleWearableSubmit}
                submitting={submitting}
                onReset={() => {
                  setSelectedDeviceId("");
                  handleWearableChange("serialNumber", "");
                  toast.info("Đã xóa chọn thiết bị.");
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Camera */}
        {activeTab === "camera" && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <CameraScanPanel onApplySerial={handleApplyCameraSerial} />

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-2 text-blue-600">
                    <FiVideo className="w-4 h-4" /> KIỂM ĐỊNH KHUNG HÌNH RTSP
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
                    FDA Class II
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-48 border border-slate-200 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
                    alt="Camera stream"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[10px] font-mono border border-white/10">
                    LIVE FEED • RTSP://192.168.1.104:554
                  </div>
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                    Độ trễ: 45ms (Tối ưu)
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Thuật toán Vision AI 3D sẽ phân tích bộ khung xương người ngã
                  trực tiếp trên chip NPU của camera.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <CameraForm
                formData={cameraData}
                errors={cameraErrors}
                onChange={handleCameraChange}
                onSubmit={handleCameraSubmit}
                submitting={submitting}
                onCancel={() => {
                  setCameraData({
                    cameraName: "",
                    serialNumber: "",
                    roomLocation: "",
                    cameraAngle: "",
                    enableTwoWayIntercom: true,
                  });
                  toast.info("Đã làm mới Form Camera.");
                }}
              />
            </div>
          </div>
        )}

        <ConfiguredDevicesList devices={configuredDevices} />
      </div>
    </div>
  );
}
