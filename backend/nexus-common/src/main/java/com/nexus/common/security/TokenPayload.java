package com.nexus.common.security;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Nội dung đã giải mã của một token hợp lệ. */
public record TokenPayload(UUID userId, String email, List<String> roles, Instant expiresAt) {
}
