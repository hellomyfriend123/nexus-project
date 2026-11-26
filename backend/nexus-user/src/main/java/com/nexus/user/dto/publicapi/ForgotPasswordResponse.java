package com.nexus.user.dto.publicapi;

import java.time.Instant;

/**
 * Phản hồi cấp mã đặt lại mật khẩu.
 * <p>
 * <b>Response KHÔNG tiết lộ email có tồn tại hay không</b> — kể cả khi email lạ, hình dạng và
 * thông báo vẫn y hệt (xem {@link #GENERIC_MESSAGE}). Vì vậy KHÔNG có cờ kiểu {@code found}:
 * một cờ như vậy chính là kênh dò tài khoản.
 * <p>
 * <b>Hai chế độ, cùng một hình dạng response:</b>
 * <ul>
 *   <li>Production ({@code expose-token=false}, mặc định): {@code resetToken} và
 *       {@code tokenExpiresAt} là {@code null}. Mã phải đi qua kênh ngoài (email/SMS) — đó là
 *       điểm mở rộng {@code PasswordResetNotifier}.</li>
 *   <li>Dev/demo ({@code expose-token=true}): trả luôn mã để dán vào Swagger hoặc gọi thẳng
 *       {@code POST /api/v1/auth/reset-password} mà không cần SMTP.</li>
 * </ul>
 *
 * @param message        thông báo chung, giống nhau cho mọi email
 * @param resetToken     mã thô — CHỈ có giá trị khi bật {@code expose-token} và được phát hành mã
 * @param tokenExpiresAt thời điểm mã hết hạn — CHỈ có giá trị khi bật {@code expose-token}
 */
public record ForgotPasswordResponse(
        String message,
        String resetToken,
        Instant tokenExpiresAt
) {

    /** Thông báo dùng chung: không tiết lộ email có tồn tại hay không. */
    public static final String GENERIC_MESSAGE =
            "Nếu email này có tài khoản trong hệ thống, mã đặt lại mật khẩu đã được tạo. "
                    + "Vui lòng kiểm tra email và làm theo hướng dẫn.";

    /** Phản hồi trung tính: email không tồn tại, HOẶC mã được ẩn ở môi trường production. */
    public static ForgotPasswordResponse generic() {
        return new ForgotPasswordResponse(GENERIC_MESSAGE, null, null);
    }

    /**
     * Phản hồi kèm mã — CHỈ dùng ở môi trường dev/demo.
     *
     * @param resetToken     mã thô để client đổi mật khẩu
     * @param tokenExpiresAt thời điểm mã hết hạn
     */
    public static ForgotPasswordResponse exposed(String resetToken, Instant tokenExpiresAt) {
        return new ForgotPasswordResponse(GENERIC_MESSAGE, resetToken, tokenExpiresAt);
    }
}
