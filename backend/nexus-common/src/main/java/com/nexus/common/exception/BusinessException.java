package com.nexus.common.exception;

import com.nexus.common.api.ErrorCode;

/**
 * Lỗi nghiệp vụ có kiểm soát. Mọi lỗi "biết trước" phải ném lớp này (hoặc lớp con),
 * GlobalExceptionHandler sẽ map sang ApiError.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(String message) {
        this(ErrorCode.BUSINESS_RULE_VIOLATION, message);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
