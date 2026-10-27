package com.nexus.commerce.entity;

import com.nexus.commerce.enums.PaymentMethod;
import com.nexus.commerce.enums.PaymentStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Giao dịch thanh toán — bảng {@code nexus_commerce.payments} (§16, FR-21).
 *
 * <p><b>Idempotent (FR-21):</b> {@code idempotencyKey} là duy nhất (unique index
 * {@code ux_payments_idempotency_key}). Buyer gửi lại cùng key → service trả về giao dịch cũ,
 * KHÔNG tạo bản ghi mới ⇒ không trừ tiền hai lần.</p>
 *
 * <p><b>Không hard delete</b> (§11.6). Không có {@code deletedAt}.</p>
 */
@Entity
@Table(
        name = "payments",
        schema = "nexus_commerce",
        uniqueConstraints = @UniqueConstraint(name = "uk_payments_idempotency_key", columnNames = "idempotency_key")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends BaseEntity {

    /** Đơn được thanh toán → {@code nexus_commerce.orders.id}. */
    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    /** Mã tham chiếu do cổng thanh toán trả về (giai đoạn CRUD để trống / sinh giả lập). */
    @Column(name = "payment_reference", length = 255)
    private String paymentReference;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;

    /** Khoá chống trùng từ client (bắt buộc, unique) — xem {@code PaymentServiceImpl#createPayment}. */
    @Column(name = "idempotency_key", nullable = false, length = 255, updatable = false)
    private String idempotencyKey;

    /** Chỉ có giá trị khi {@code status = SUCCESS}. */
    @Column(name = "paid_at")
    private Instant paidAt;
}
