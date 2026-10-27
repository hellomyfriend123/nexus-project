package com.nexus.common.security;

import com.nexus.common.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/** Truy cập người dùng hiện tại. Controller/service dùng lớp này, KHÔNG nhận userId từ request. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CurrentUser currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser currentUser)) {
            throw new com.nexus.common.exception.BusinessException(
                    com.nexus.common.api.ErrorCode.UNAUTHORIZED, "Chưa xác thực");
        }
        return currentUser;
    }

    public static UUID currentUserId() {
        return currentUser().userId();
    }

    public static String currentUserEmail() {
        return currentUser().email();
    }

    public static boolean hasRole(String role) {
        try {
            return currentUser().hasRole(role);
        } catch (BusinessException ex) {
            return false;
        }
    }
}
