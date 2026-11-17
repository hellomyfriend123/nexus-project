package com.nexus.common.security;

/**
 * Cổng (port) để tầng bảo mật dùng chung biến một danh tính Google đã xác thực
 * thành tài khoản Nexus + token nội bộ.
 * <p>
 * <b>Vì sao phải là interface ở {@code nexus-common}?</b>
 * <ul>
 *   <li>{@code nexus-common} KHÔNG được phụ thuộc {@code nexus-user} (sai chiều phụ thuộc:
 *       {@code nexus-user} → {@code nexus-common}).</li>
 *   <li>Nhưng việc tạo/tra cứu bảng {@code nexus_user.users} chỉ {@code nexus-user} làm được.</li>
 *   <li>→ Khai báo hợp đồng ở đây, {@code nexus-user} cài đặt, Spring nối hai đầu lúc chạy.</li>
 * </ul>
 * Nhờ vậy {@code SecurityConfig} không cần biết gì về JPA hay bảng users.
 */
public interface SocialLoginHandler {

    /**
     * Đăng nhập (hoặc tự tạo) tài khoản từ danh tính đã được nhà cung cấp xác thực.
     *
     * @param provider      mã nhà cung cấp, ví dụ {@code google}
     * @param subject       định danh bền vững tại nhà cung cấp (Google: claim {@code sub})
     * @param email         email do nhà cung cấp trả về
     * @param fullName      tên hiển thị
     * @param emailVerified nhà cung cấp có xác nhận email này không
     * @param requestedRole vai trò client đề nghị khi tạo tài khoản mới ({@code BUYER}/{@code SELLER});
     *                      tài khoản đã tồn tại thì giữ nguyên vai trò trong DB
     * @return token nội bộ + thông tin tài khoản
     * @throws com.nexus.common.exception.BusinessException nếu email chưa xác thực hoặc tài khoản bị khoá
     */
    SocialLoginResult authenticate(String provider,
                                   String subject,
                                   String email,
                                   String fullName,
                                   boolean emailVerified,
                                   String requestedRole);
}
