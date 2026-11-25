package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.user.dto.admin.AdminUserResponse;
import com.nexus.user.dto.admin.AdminUserSummaryResponse;
import com.nexus.user.dto.buyer.ProfileResponse;
import com.nexus.user.dto.buyer.UpdateProfileRequest;
import com.nexus.user.entity.User;
import com.nexus.user.enums.Gender;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.service.RoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ {@link UserServiceImpl} — thuần Mockito, KHÔNG nạp Spring context (§14 CONVENTIONS).
 */
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private UserServiceImpl userService;

    private static User user(UUID id, String email, String username) {
        return User.builder()
                .id(id)
                .email(email)
                .username(username)
                .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
                .fullName("Nguyễn Văn A")
                .status(UserStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("FR-03: sửa hồ sơ của người khác → ForbiddenOperationException (403), không chạm DB")
    void updateProfile_suaHoSoNguoiKhac_nemForbiddenOperationException() {
        UUID requesterId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UpdateProfileRequest request = new UpdateProfileRequest("Nguyễn Văn B", null, null, null, null);

        ForbiddenOperationException exception = assertThrows(ForbiddenOperationException.class,
                () -> userService.updateProfile(requesterId, otherUserId, request));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("chính mình"));
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("FR-03: đọc hồ sơ của người khác → ForbiddenOperationException (403)")
    void getProfile_docHoSoNguoiKhac_nemForbiddenOperationException() {
        UUID requesterId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        assertThrows(ForbiddenOperationException.class,
                () -> userService.getProfile(requesterId, otherUserId));

        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("FR-03: cập nhật hồ sơ của chính mình → chỉ đổi các trường được phép")
    void updateProfile_chinhChu_capNhatCacTruongDuocPhep() {
        UUID userId = UUID.randomUUID();
        User entity = user(userId, "buyer01@nexus.local", "buyer01");
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(entity));
        when(userRepository.save(entity)).thenReturn(entity);

        ProfileResponse response = userService.updateProfile(userId, userId, new UpdateProfileRequest(
                "  Nguyễn Văn B  ", "0912345678", "Hà Nội", LocalDate.of(2000, 1, 1), Gender.MALE));

        assertEquals("Nguyễn Văn B", response.fullName());
        assertEquals("0912345678", response.phone());
        assertEquals("Hà Nội", response.address());
        assertEquals(LocalDate.of(2000, 1, 1), response.dateOfBirth());
        assertEquals(Gender.MALE, response.gender());
        // email/username là định danh đăng nhập → KHÔNG đổi qua endpoint hồ sơ
        assertEquals("buyer01@nexus.local", response.email());
        assertEquals("buyer01", response.username());
    }

    @Test
    @DisplayName("FR-03: gửi chuỗi rỗng để xoá một trường hồ sơ (phone/address)")
    void updateProfile_chuoiRong_xoaTruong() {
        UUID userId = UUID.randomUUID();
        User entity = user(userId, "buyer01@nexus.local", "buyer01");
        entity.setPhone("0912345678");
        entity.setAddress("Hà Nội");
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(entity));
        when(userRepository.save(entity)).thenReturn(entity);

        ProfileResponse response = userService.updateProfile(userId, userId,
                new UpdateProfileRequest(null, "", "", null, null));

        assertNull(response.phone());
        assertNull(response.address());
        assertEquals("Nguyễn Văn A", response.fullName());
    }

    @Test
    @DisplayName("FR-03: cập nhật hồ sơ với họ tên rỗng → BusinessException(VALIDATION_ERROR)")
    void updateProfile_hoTenRong_nemBusinessException() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndDeletedAtIsNull(userId))
                .thenReturn(Optional.of(user(userId, "buyer01@nexus.local", "buyer01")));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.updateProfile(userId, userId, new UpdateProfileRequest("   ", null, null, null, null)));

        assertEquals(ErrorCode.VALIDATION_ERROR, exception.getErrorCode());
    }

    @Test
    @DisplayName("FR-03: người dùng không tồn tại → ResourceNotFoundException (404)")
    void getProfile_khongTonTai_nemResourceNotFoundException() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> userService.getProfile(userId, userId));

        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("FR-04: Admin tự khoá chính mình → BusinessException, không chạm DB")
    void updateStatus_adminTuKhoaChinhMinh_nemBusinessException() {
        UUID adminId = UUID.randomUUID();

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.updateStatus(adminId, adminId, UserStatus.INACTIVE));

        assertEquals(ErrorCode.BUSINESS_RULE_VIOLATION, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("chính mình"));
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("FR-04: Admin tự đặt trạng thái BANNED cho chính mình → bị chặn")
    void updateStatus_adminTuBanChinhMinh_nemBusinessException() {
        UUID adminId = UUID.randomUUID();

        BusinessException exception = assertThrows(BusinessException.class,
                () -> userService.updateStatus(adminId, adminId, UserStatus.BANNED));

        assertEquals(ErrorCode.BUSINESS_RULE_VIOLATION, exception.getErrorCode());
    }

    @Test
    @DisplayName("FR-04: Admin vô hiệu hoá người dùng khác → cập nhật trạng thái thành công")
    void updateStatus_nguoiDungKhac_capNhatThanhCong() {
        UUID adminId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        User target = user(targetId, "buyer01@nexus.local", "buyer01");
        when(userRepository.findByIdAndDeletedAtIsNull(targetId)).thenReturn(Optional.of(target));
        when(userRepository.save(target)).thenReturn(target);
        when(roleService.findRoleCodesOfUser(targetId)).thenReturn(List.of(RoleService.ROLE_BUYER));

        AdminUserResponse response = userService.updateStatus(adminId, targetId, UserStatus.INACTIVE);

        assertEquals(UserStatus.INACTIVE, response.status());
        assertEquals(List.of(RoleService.ROLE_BUYER), response.roles());
    }

    @Test
    @DisplayName("FR-04/FR-52: danh sách người dùng trả PageResponse kèm vai trò từng người")
    void searchUsers_traVePageResponseKemVaiTro() {
        UUID userId = UUID.randomUUID();
        User entity = user(userId, "buyer01@nexus.local", "buyer01");
        Pageable pageable = PageRequest.of(0, 20);
        Page<User> page = new PageImpl<>(List.of(entity), pageable, 1);

        when(userRepository.findAll(ArgumentMatchers.<Specification<User>>any(), any(Pageable.class)))
                .thenReturn(page);
        when(roleService.findRoleCodesOfUsers(List.of(userId)))
                .thenReturn(Map.of(userId, List.of(RoleService.ROLE_BUYER)));

        PageResponse<AdminUserSummaryResponse> response =
                userService.searchUsers("buyer", UserStatus.ACTIVE, RoleService.ROLE_BUYER, pageable);

        assertEquals(1, response.content().size());
        assertEquals(1, response.totalElements());
        assertEquals(0, response.page());
        assertTrue(response.first());
        assertNotNull(response.content().get(0).roles());
        assertEquals(List.of(RoleService.ROLE_BUYER), response.content().get(0).roles());
    }
}
