package com.nexus.common.exception;

import com.nexus.common.api.ApiError;
import com.nexus.common.api.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

/**
 * Bộ xử lý lỗi duy nhất cho toàn hệ thống — KHÔNG viết lại ở từng module.
 * Mọi response lỗi có cùng cấu trúc {@link ApiError}.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldViolation> details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiError.FieldViolation(error.getField(), error.getDefaultMessage()))
                .toList();
        return build(ErrorCode.VALIDATION_ERROR, "Dữ liệu không hợp lệ", request, details);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex,
                                                              HttpServletRequest request) {
        List<ApiError.FieldViolation> details = ex.getConstraintViolations().stream()
                .map(violation -> new ApiError.FieldViolation(violation.getPropertyPath().toString(),
                        violation.getMessage()))
                .toList();
        return build(ErrorCode.VALIDATION_ERROR, "Dữ liệu không hợp lệ", request, details);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException ex, HttpServletRequest request) {
        return build(ex.getErrorCode(), ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(ErrorCode.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này", request, List.of());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(ErrorCode.UNAUTHORIZED, "Chưa xác thực hoặc token không hợp lệ", request, List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex,
                                                        HttpServletRequest request) {
        log.warn("Vi phạm ràng buộc dữ liệu tại {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(ErrorCode.CONFLICT, "Dữ liệu vi phạm ràng buộc toàn vẹn", request, List.of());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            IllegalArgumentException.class})
    public ResponseEntity<ApiError> handleBadRequest(Exception ex, HttpServletRequest request) {
        return build(ErrorCode.BAD_REQUEST, "Yêu cầu không hợp lệ: " + ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Lỗi không mong đợi tại {}", request.getRequestURI(), ex);
        return build(ErrorCode.INTERNAL_ERROR, "Lỗi hệ thống, vui lòng thử lại sau", request, List.of());
    }

    private static ResponseEntity<ApiError> build(ErrorCode code, String message, HttpServletRequest request,
                                                  List<ApiError.FieldViolation> details) {
        return ResponseEntity.status(code.status())
                .body(ApiError.of(code, message, request.getRequestURI(), details));
    }
}
