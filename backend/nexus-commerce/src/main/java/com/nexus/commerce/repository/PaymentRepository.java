package com.nexus.commerce.repository;

import com.nexus.commerce.entity.Payment;
import com.nexus.commerce.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn giao dịch thanh toán (FR-21).
 *
 * <p>{@link #findByIdempotencyKey(String)} là trái tim của cơ chế idempotent: nếu đã có bản ghi
 * với khoá này thì service trả lại chính bản ghi đó thay vì tạo mới.</p>
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    List<Payment> findAllByOrderId(UUID orderId);

    Page<Payment> findAllByOrderId(UUID orderId, Pageable pageable);

    /** DB có unique partial index {@code ux_payments_one_success_per_order}: tối đa 1 giao dịch SUCCESS/đơn. */
    Optional<Payment> findFirstByOrderIdAndStatus(UUID orderId, PaymentStatus status);

    Optional<Payment> findByIdAndOrderId(UUID id, UUID orderId);
}
