package com.nexus.user.service;

import com.nexus.common.api.PageResponse;
import com.nexus.user.dto.admin.AdminUserResponse;
import com.nexus.user.dto.admin.AdminUserSummaryResponse;
import com.nexus.user.dto.buyer.ProfileResponse;
import com.nexus.user.dto.buyer.UpdateProfileRequest;
import com.nexus.user.enums.UserStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Nghiệp vụ người dùng — FR-03 (hồ sơ Buyer/Seller), FR-04 &amp; FR-52 (Admin quản lý người dùng).
 */
public interface UserService {

    /**
     * FR-03 — đọc hồ sơ.
     *
     * @param requesterId người đang gọi API (lấy từ token)
     * @param userId      chủ hồ sơ cần đọc
     * @throws com.nexus.common.exception.ForbiddenOperationException nếu không phải chủ hồ sơ
     */
    ProfileResponse getProfile(UUID requesterId, UUID userId);

    /**
     * FR-03 — cập nhật hồ sơ (chỉ fullName, phone, address, dateOfBirth, gender).
     * <p>
     * Không cho sửa email/username ở đây vì đó là định danh đăng nhập.
     *
     * @throws com.nexus.common.exception.ForbiddenOperationException nếu không phải chủ hồ sơ
     */
    ProfileResponse updateProfile(UUID requesterId, UUID userId, UpdateProfileRequest request);

    /** FR-04 &amp; FR-52 — danh sách người dùng có lọc động + phân trang (Admin). */
    PageResponse<AdminUserSummaryResponse> searchUsers(String keyword, UserStatus status, String roleCode,
                                                       Pageable pageable);

    /** FR-04 — chi tiết một người dùng (Admin). */
    AdminUserResponse getUser(UUID id);

    /**
     * FR-04 — đổi trạng thái tài khoản (kích hoạt / vô hiệu hoá / khoá).
     *
     * @throws com.nexus.common.exception.BusinessException nếu Admin tự khoá chính mình
     */
    AdminUserResponse updateStatus(UUID requesterId, UUID userId, UserStatus status);
}
