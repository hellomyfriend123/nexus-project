package com.nexus.common.api;

import java.time.Instant;
import java.util.List;

/**
 * Hợp đồng lỗi duy nhất: timestamp / status / error / message / path / details.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldViolation> details
) {

    public record FieldViolation(String field, String message) {
    }

    public static ApiError of(ErrorCode code, String message, String path) {
        return of(code, message, path, List.of());
    }

    public static ApiError of(ErrorCode code, String message, String path, List<FieldViolation> details) {
        return new ApiError(Instant.now(), code.status().value(), code.code(), message, path,
                details == null ? List.of() : details);
    }
}
