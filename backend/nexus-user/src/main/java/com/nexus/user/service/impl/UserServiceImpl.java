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
import com.nexus.user.enums.UserStatus;
import com.nexus.user.mapper.UserMapper;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.service.RoleService;
import com.nexus.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Cài đặt {@link UserService} — FR-03 (hồ sơ), FR-04 &amp; FR-52 (Admin quản lý người dùng).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleService roleService;

    @Override
    public ProfileResponse getProfile(UUID requesterId, UUID userId) {
        requireOwnership(requesterId, userId);
        return UserMapper.toProfileResponse(requireUser(userId));
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(UUID requesterId, UUID userId, UpdateProfileRequest request) {
        requireOwnership(requesterId, userId);
        User user = requireUser(userId);

        // CHỈ cho sửa các trường hồ sơ. email/username là định danh đăng nhập (duy nhất, gắn với token
        // và mọi tham chiếu dữ liệu ở module khác) nên KHÔNG đổi qua endpoint này — muốn đổi phải đi
        // qua luồng riêng có xác minh quyền sở hữu (OTP/email xác nhận), nằm ngoài phạm vi FR-03.
        if (request.fullName() != null) {
            String fullName = request.fullName().trim();
            if (fullName.isEmpty()) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Họ tên không được để trống");
            }
            user.setFullName(fullName);
        }
        if (request.phone() != null) {
            user.setPhone(trimToNull(request.phone()));
        }
        if (request.address() != null) {
            user.setAddress(trimToNull(request.address()));
        }
        if (request.dateOfBirth() != null) {
            user.setDateOfBirth(request.dateOfBirth());
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }

        User saved = userRepository.save(user);
        log.info("Người dùng {} cập nhật hồ sơ của chính mình", userId);
        return UserMapper.toProfileResponse(saved);
    }

    @Override
    public PageResponse<AdminUserSummaryResponse> searchUsers(String keyword, UserStatus status, String roleCode,
                                                              Pageable pageable) {
        Page<User> page = userRepository.findAll(UserRepository.filter(keyword, status, roleCode), pageable);

        List<UUID> userIds = page.getContent().stream().map(user -> user.getId()).toList();
        Map<UUID, List<String>> rolesByUser = roleService.findRoleCodesOfUsers(userIds);

        return PageResponse.from(page, user -> UserMapper.toAdminSummary(user, rolesByUser.get(user.getId())));
    }

    @Override
    public AdminUserResponse getUser(UUID id) {
        User user = requireUser(id);
        return UserMapper.toAdminResponse(user, roleService.findRoleCodesOfUser(id));
    }

    @Override
    @Transactional
    public AdminUserResponse updateStatus(UUID requesterId, UUID userId, UserStatus status) {
        if (requesterId.equals(userId) && status != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "Quản trị viên không thể tự khoá hoặc vô hiệu hoá tài khoản của chính mình");
        }

        User user = requireUser(userId);
        user.setStatus(status);
        User saved = userRepository.save(user);

        log.info("Quản trị viên {} đổi trạng thái người dùng {} thành {}", requesterId, userId, status);
        return UserMapper.toAdminResponse(saved, roleService.findRoleCodesOfUser(userId));
    }

    /** FR-03 chỉ cho thao tác trên hồ sơ của chính mình — kiểm tra trước khi chạm DB. */
    private static void requireOwnership(UUID requesterId, UUID userId) {
        if (requesterId == null || userId == null || !requesterId.equals(userId)) {
            throw new ForbiddenOperationException("Bạn chỉ được xem và cập nhật hồ sơ của chính mình");
        }
    }

    private User requireUser(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
