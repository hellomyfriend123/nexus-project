package com.nexus.user.service;

import com.nexus.user.dto.publicapi.ForgotPasswordRequest;
import com.nexus.user.dto.publicapi.ForgotPasswordResponse;
import com.nexus.user.dto.publicapi.ResetPasswordRequest;

/**
 * Nghiệp vụ quên mật khẩu — bổ sung cho FR-02 (hai endpoint công khai
 * {@code POST /api/v1/auth/forgot-password} và {@code POST /api/v1/auth/reset-password}).
 * <p>
 * Luồng hai bước:
 * <ol>
 *   <li><b>Yêu cầu mã</b> — người dùng gửi email; hệ thống tạo mã dùng-một-lần có hạn
 *       (mặc định {@value #DEFAULT_TTL_MINUTES} phút) và chuyển cho người dùng qua kênh ngoài.</li>
 *   <li><b>Đặt mật khẩu mới</b> — người dùng gửi mã + mật khẩu mới; hệ thống kiểm tra mã,
 *       ghi {@code password_hash} mới và vô hiệu hoá mọi mã còn sống của tài khoản đó.</li>
 * </ol>
 */
public interface PasswordResetService {

    /** Hạn dùng mặc định của mã (phút) — có thể ghi đè bằng {@code nexus.security.password-reset.ttl-minutes}. */
    int DEFAULT_TTL_MINUTES = 15;

    /**
     * Bước 1 — cấp mã đặt lại mật khẩu cho email.
     * <p>
     * <b>Không bao giờ ném lỗi "email không tồn tại"</b>: nếu email lạ, method trả về phản hồi
     * trung tính y hệt trường hợp thành công, để API không trở thành công cụ dò danh sách tài khoản.
     * Tài khoản đã bị khoá ({@code INACTIVE}/{@code BANNED}) cũng bị coi như không tồn tại.
     * <p>
     * Mọi mã cũ còn sống của người dùng bị vô hiệu hoá trước khi phát mã mới.
     *
     * @return phản hồi chung; chứa mã thô chỉ khi bật {@code nexus.security.password-reset.expose-token}
     */
    ForgotPasswordResponse requestReset(ForgotPasswordRequest request);

    /**
     * Bước 2 — đặt mật khẩu mới bằng mã.
     * <p>
     * Sau khi thành công: mã bị đánh dấu đã dùng, toàn bộ mã khác của người dùng bị vô hiệu hoá,
     * và {@code password_hash} được thay bằng bản băm BCrypt của mật khẩu mới.
     *
     * @throws com.nexus.common.exception.BusinessException {@code UNAUTHORIZED} nếu mã sai, đã dùng
     *                                                      hoặc đã hết hạn; {@code BAD_REQUEST} nếu
     *                                                      mật khẩu mới trùng mật khẩu cũ
     */
    void resetPassword(ResetPasswordRequest request);
}
