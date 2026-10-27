package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.user.entity.Role;
import com.nexus.user.entity.UserRole;
import com.nexus.user.repository.RoleRepository;
import com.nexus.user.repository.UserRoleRepository;
import com.nexus.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Cài đặt {@link RoleService} — đọc vai trò từ {@code nexus_user.roles} và
 * bản gán vai trò từ {@code nexus_user.user_roles}.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public Role getByCode(String code) {
        String normalized = normalize(code);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã vai trò không được để trống");
        }
        return roleRepository.findByCode(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò", normalized));
    }

    @Override
    public List<Role> getByCodes(Collection<String> codes) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        List<String> normalized = codes.stream()
                .map(RoleServiceImpl::normalize)
                .filter(code -> code != null)
                .distinct()
                .toList();
        return normalized.isEmpty() ? List.of() : roleRepository.findAllByCodeIn(normalized);
    }

    @Override
    public List<String> findRoleCodesOfUser(UUID userId) {
        if (userId == null) {
            return List.of();
        }
        return userRoleRepository.findRoleCodesByUserId(userId);
    }

    @Override
    public Map<UUID, List<String>> findRoleCodesOfUsers(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<UserRole> assignments = userRoleRepository.findAllWithRoleByUserIds(userIds);
        // Dùng LinkedHashMap để thứ tự người dùng ổn định khi ghi log/debug
        return assignments.stream().collect(Collectors.groupingBy(
                assignment -> assignment.getId().getUserId(),
                LinkedHashMap::new,
                Collectors.mapping(assignment -> assignment.getRole().getCode(), Collectors.toList())));
    }

    @Override
    public boolean userHasRole(UUID userId, String roleCode) {
        String normalized = normalize(roleCode);
        if (userId == null || normalized == null) {
            return false;
        }
        return userRoleRepository.countByUserIdAndRoleCode(userId, normalized) > 0;
    }

    private static String normalize(String code) {
        return code == null || code.isBlank() ? null : code.trim().toUpperCase(Locale.ROOT);
    }
}
