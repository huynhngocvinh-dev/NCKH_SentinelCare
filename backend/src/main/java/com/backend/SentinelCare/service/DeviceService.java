package com.backend.SentinelCare.service;

import com.backend.SentinelCare.dto.CameraDeviceRequest;
import com.backend.SentinelCare.dto.WearableDeviceRequest;
import com.backend.SentinelCare.model.*;
import com.backend.SentinelCare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final AccountRepository accountRepository;
    private final MonitoredSubjectRepository monitoredSubjectRepository;
    private final IotDeviceRepository iotDeviceRepository;
    private final AddressRepository addressRepository;
    private final CameraDeviceRepository cameraDeviceRepository;

    // =========================================================================
    // 1. LUỒNG LẤY DANH SÁCH THIẾT BỊ (Phục vụ API GET /api/devices)
    // =========================================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getUserDevices(String currentUserEmail) {
        Account account = accountRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người quản lý!"));

        // Lấy danh sách Người được giám sát thuộc sở hữu của Account
        List<MonitoredSubject> subjects = monitoredSubjectRepository.findByAccountId(account.getId());

        // Lấy danh sách Thiết bị đeo gắn với danh sách Người được giám sát
        List<IotDevice> wearables = iotDeviceRepository.findByMonitoredSubjectIn(subjects);

        // Lấy danh sách Camera gắn với địa chỉ nhà của Account
        List<Address> addresses = addressRepository.findByAccountId(account.getId()).stream().toList();
        List<CameraDevice> cameras = cameraDeviceRepository.findByAddressIn(addresses);

        return Map.of(
            "wearables", wearables,
            "cameras", cameras
        );
    }

    // =========================================================================
    // 2. LUỒNG LƯU THIẾT BỊ ĐEO (Lưu monitored_subjects -> Lưu iot_devices)
    // =========================================================================
    @Transactional
    public void registerWearableDevice(WearableDeviceRequest request, String currentUserEmail) {
        Account managerAccount = accountRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người quản lý!"));

        // Kiểm tra xem Serial thiết bị đã được đăng ký trong CSDL chưa
        if (iotDeviceRepository.existsByDeviceSerial(request.getSerialNumber())) {
            throw new RuntimeException("Mã Serial thiết bị (" + request.getSerialNumber() + ") đã được ghép nối trước đó!");
        }

        // Bước A: Tạo MỚI hồ sơ Người được giám sát (Ông Minh / Bà Thông)
        MonitoredSubject subject = new MonitoredSubject();
        subject.setAccount(managerAccount);
        subject.setFullName(request.getSubjectFullName());
        
        // Xử lý Ngày sinh
        if (StringUtils.hasText(request.getSubjectDob())) {
            subject.setDateOfBirth(LocalDate.parse(request.getSubjectDob()));
        }

        // Xử lý Giới tính
        if (StringUtils.hasText(request.getSubjectGender())) {
            try {
                subject.setGender(MonitoredSubject.Gender.valueOf(request.getSubjectGender().toLowerCase()));
            } catch (Exception e) {
                subject.setGender(MonitoredSubject.Gender.other);
            }
        } else {
            subject.setGender(MonitoredSubject.Gender.other);
        }

        subject.setMedicalNotes(request.getMedicalHistory());
        subject.setWearPosition(request.getWearPosition());

        // Lưu bảng monitored_subjects
        MonitoredSubject savedSubject = monitoredSubjectRepository.save(subject);

        // Bước B: Tạo IotDevice gắn liền với Người được giám sát
        IotDevice device = new IotDevice();
        device.setDeviceSerial(request.getSerialNumber());
        device.setMonitoredSubject(savedSubject);
        device.setConnectionStatus(IotDevice.ConnectionStatus.online);
        device.setBatteryLevel(100);

        // Lưu bảng iot_devices
        iotDeviceRepository.save(device);
    }

    // =========================================================================
    // 3. LUỒNG LƯU CAMERA AI (Lưu addresses -> Lưu camera_devices)
    // =========================================================================
    @Transactional
    public void registerCameraDevice(CameraDeviceRequest request, String currentUserEmail) {
        Account currentUserAccount = accountRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản đăng nhập!"));

        // Bước A: Lấy hoặc tạo Địa chỉ mặc định cho tài khoản
        Address address = addressRepository.findByAccountId(currentUserAccount.getId())
                .orElseGet(() -> {
                    Address newAddr = new Address();
                    newAddr.setAccount(currentUserAccount);
                    newAddr.setAddressLine("Địa chỉ mặc định");
                    newAddr.setIsPrimary(true);
                    return addressRepository.save(newAddr);
                });

        // Bước B: Tạo CameraDevice
        CameraDevice camera = new CameraDevice();
        camera.setCameraCode(request.getSerialNumber());
        camera.setAddress(address);
        
        // Lấy vị trí phòng (nếu rỗng lấy cameraName)
        String location = StringUtils.hasText(request.getRoomLocation()) 
                ? request.getRoomLocation() 
                : (StringUtils.hasText(request.getCameraName()) ? request.getCameraName() : "Chưa xác định");
        
        camera.setLocationName(location);
        camera.setStatus(CameraDevice.Status.active);

        // Lưu bảng camera_devices
        cameraDeviceRepository.save(camera);
    }
}