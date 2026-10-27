package com.nexus.user.service;

import com.nexus.user.dto.publicapi.AuthResponse;
import com.nexus.user.dto.publicapi.LoginRequest;
import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.dto.common.UserResponse;

import java.util.UUID;

/**
 * Nghiệp vụ xác thực tài khoản — FR-01 (đăng ký), FR-02 (đăng nhập/đăng xuất/thông tin hiện tại).
 */
public interface AuthService {

    /**
     * FR-01 — đăng ký tài khoản Buyer/Seller (mật khẩu băm BCrypt, gán vai trò tương ứng).
     *
     * @throws com.nexus.common.exception.DuplicateResourceException nếu email hoặc username đã tồn tại
     */
    UserResponse register(RegisterRequest request);

    /**
     * FR-02 — đăng nhập bằng email + mật khẩu.
     *
     * @throws com.nexus.common.exception.BusinessException {@code UNAUTHORIZED} nếu sai thông tin đăng nhập,
     *                                                      {@code FORBIDDEN} nếu tài khoản không ở trạng thái ACTIVE
     */
    AuthResponse login(LoginRequest request);

    /**
     * FR-02 — đăng xuất.
     * <p>
     * Hệ thống chạy stateless: server không lưu phiên nên không có gì để huỷ, client chỉ cần xoá token.
     * Method này tồn tại để đủ hợp đồng FR và làm điểm mở rộng (danh sách đen token, thu hồi theo thiết bị).
     */
    void logout();

    /** FR-02 — thông tin người dùng đang đăng nhập (đọc từ token, không nhận từ client). */
    UserResponse getCurrentUser(UUID userId);
}
