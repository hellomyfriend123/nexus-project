package com.nexus.common.security;

import java.util.List;
import java.util.UUID;

/**
 * Người dùng đang đăng nhập — chính là principal của {@code Authentication}.
 * Lấy ra bằng {@link SecurityUtils#currentUser()}.
 */
public record CurrentUser(UUID userId, String email, List<String> roles) {

    public CurrentUser {
        roles = roles == null ? List.of() : List.copyOf(roles);
    }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }
}
