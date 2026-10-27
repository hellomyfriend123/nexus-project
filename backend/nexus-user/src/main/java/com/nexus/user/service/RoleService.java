package com.nexus.user.service;

import com.nexus.user.entity.Role;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Nghiệp vụ vai trò (FR-01, FR-04).
 * <p>
 * Ba mã vai trò chuẩn của hệ thống được khai báo ngay tại đây để mọi tầng
 * (DTO validation, seeder, service) dùng chung một nguồn, không hard-code rải rác.
 */
public interface RoleService {

    String ROLE_BUYER = "BUYER";
    String ROLE_SELLER = "SELLER";
    String ROLE_ADMIN = "ADMIN";

    /** @throws com.nexus.common.exception.ResourceNotFoundException nếu chưa seed vai trò này */
    Role getByCode(String code);

    /** Danh sách vai trò theo mã (bỏ qua mã không tồn tại). */
    List<Role> getByCodes(Collection<String> codes);

    /** Mã vai trò của một người dùng — dùng để sinh token (FR-02). */
    List<String> findRoleCodesOfUser(UUID userId);

    /** Mã vai trò của nhiều người dùng một lượt — dùng cho danh sách Admin (FR-04/FR-52). */
    Map<UUID, List<String>> findRoleCodesOfUsers(Collection<UUID> userIds);

    boolean userHasRole(UUID userId, String roleCode);
}
