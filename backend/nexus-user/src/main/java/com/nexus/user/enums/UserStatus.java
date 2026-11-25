package com.nexus.user.enums;

/**
 * Trạng thái tài khoản (FR-04, FR-52 — Admin quản lý người dùng).
 * <p>
 * KHÔNG hard delete người dùng: chỉ chuyển trạng thái hoặc đánh dấu {@code deleted_at}.
 */
public enum UserStatus {

    /** Đang hoạt động — được phép đăng nhập. */
    ACTIVE,

    /** Bị vô hiệu hoá (chưa kích hoạt hoặc Admin tạm khoá) — không đăng nhập được. */
    INACTIVE,

    /** Bị khoá vĩnh viễn do vi phạm — không đăng nhập được. */
    BANNED
}
