package com.backend.SentinelCare.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

public final class Utc {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private Utc() {
    }

    // Thời điểm hiện tại theo UTC (giá trị lưu vào CSDL)
    public static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    // Giá trị UTC trong CSDL -> Instant (JSON trả về có hậu tố Z, trình duyệt tự
    // đổi sang giờ máy)
    public static Instant toInstant(LocalDateTime utc) {
        return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
    }

    // Chỉ dùng để hiển thị (email): UTC -> giờ Việt Nam
    public static LocalDateTime toVietnam(LocalDateTime utc) {
        return utc == null ? null : utc.atOffset(ZoneOffset.UTC).atZoneSameInstant(VIETNAM).toLocalDateTime();
    }
}