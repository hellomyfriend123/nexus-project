package com.nexus.commerce.enums;

import java.util.Locale;
import java.util.Optional;

/**
 * Trạng thái đơn hàng (FR-24, §11.4).
 *
 * <p><b>KHÔNG có {@code PAID}</b>: thanh toán thành công chỉ đưa đơn từ {@link #PENDING}
 * sang {@link #CONFIRMED} (xem {@code PaymentServiceImpl#confirmPayment}).</p>
 *
 * <p>Chuỗi chuyển trạng thái hợp lệ của Seller (FR-24):
 * {@code PENDING → CONFIRMED → SHIPPING → COMPLETED}, và mọi trạng thái chưa kết thúc đều
 * có thể chuyển sang {@link #CANCELLED} (FR-25). Chặn nhảy cóc và chặn lùi.</p>
 */
public enum OrderStatus {

    PENDING,
    CONFIRMED,
    SHIPPING,
    COMPLETED,
    CANCELLED;

    /** Trạng thái kết thúc — không được chuyển đi đâu nữa. */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }

    /**
     * FR-24: trạng thái kế tiếp hợp lệ trong chuỗi tiến.
     * {@code COMPLETED} và {@code CANCELLED} không có trạng thái kế tiếp.
     */
    public Optional<OrderStatus> next() {
        return switch (this) {
            case PENDING -> Optional.of(CONFIRMED);
            case CONFIRMED -> Optional.of(SHIPPING);
            case SHIPPING -> Optional.of(COMPLETED);
            case COMPLETED, CANCELLED -> Optional.empty();
        };
    }

    /**
     * FR-24 + FR-25: chỉ cho phép đi tới {@code next()} hoặc huỷ.
     * Mọi thứ khác (nhảy cóc, lùi, hồi sinh đơn đã kết thúc) đều bị chặn ở service.
     */
    public boolean canTransitionTo(OrderStatus target) {
        if (target == null || this == target) {
            return false;
        }
        if (target == CANCELLED) {
            return !isTerminal();
        }
        return next().filter(target::equals).isPresent();
    }

    /** Parse không phân biệt hoa thường; trả về rỗng nếu chuỗi không hợp lệ (→ BusinessException ở service). */
    public static Optional<OrderStatus> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
