package com.nexus.common.security.oauth2;

import com.nexus.common.security.SocialLoginResult;

import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kho mã dùng-một-lần để chuyển kết quả đăng nhập OAuth2 từ backend về frontend một cách an toàn.
 * <p>
 * <b>Vì sao không đặt thẳng access token lên URL?</b>
 * Token trên URL sẽ nằm trong lịch sử trình duyệt, log của proxy, header {@code Referer}
 * gửi sang site khác và ảnh chụp màn hình. Kẻ tấn công đọc được URL là chiếm được phiên.
 * <p>
 * Cách làm ở đây: backend chỉ đưa một <b>mã ngẫu nhiên dùng một lần</b> lên URL; frontend đổi mã đó
 * lấy token qua {@code POST /api/v1/auth/oauth2/exchange} (cùng origin, có CORS chuẩn).
 * Mã hết hạn sau {@link #TTL} và bị xoá ngay khi dùng — URL bị lộ cũng vô dụng.
 * <p>
 * Lưu trong bộ nhớ là đủ cho mô hình một instance. Khi chạy nhiều instance (scale ngang) phải
 * thay bằng Redis/bảng DB — chỉ cần cài đặt lại interface này.
 */
public class OAuth2LoginCodeStore {

    /** Mã sống rất ngắn: chỉ đủ để trình duyệt chuyển trang và frontend gọi đổi token. */
    private static final Duration TTL = Duration.ofSeconds(60);

    private record Entry(SocialLoginResult result, Instant expiresAt) {
    }

    private final Map<String, Entry> codes = new ConcurrentHashMap<>();

    /** Lưu kết quả đăng nhập, trả về mã dùng một lần để đặt lên URL. */
    public String issue(SocialLoginResult result) {
        purgeExpired();
        String code = UUID.randomUUID().toString().replace("-", "");
        codes.put(code, new Entry(result, Instant.now().plus(TTL)));
        return code;
    }

    /**
     * Đổi mã lấy kết quả đăng nhập và <b>xoá mã ngay lập tức</b> (dùng một lần).
     *
     * @return rỗng nếu mã không tồn tại, đã dùng, hoặc đã hết hạn
     */
    public Optional<SocialLoginResult> consume(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        purgeExpired();
        Entry entry = codes.remove(code);
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.result());
    }

    /** Dọn mã hết hạn để map không phình mãi khi có nhiều lượt đăng nhập bị bỏ dở. */
    private void purgeExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, Entry>> it = codes.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().expiresAt().isBefore(now)) {
                it.remove();
            }
        }
    }
}
