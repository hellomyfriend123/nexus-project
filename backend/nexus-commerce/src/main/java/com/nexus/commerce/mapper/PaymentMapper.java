package com.nexus.commerce.mapper;

import com.nexus.commerce.dto.buyer.PaymentResponse;
import com.nexus.commerce.entity.Payment;

import java.util.List;

/**
 * Mapper viết tay cho giao dịch thanh toán (§9).
 * Không expose {@code version}/{@code updatedAt} ra ngoài (§6).
 */
public final class PaymentMapper {

    private PaymentMapper() {
    }

    public static PaymentResponse toResponse(Payment entity) {
        return new PaymentResponse(
                entity.getId(),
                entity.getOrderId(),
                entity.getPaymentMethod() == null ? null : entity.getPaymentMethod().name(),
                entity.getPaymentReference(),
                MoneyUtils.money(entity.getAmount()),
                entity.getStatus() == null ? null : entity.getStatus().name(),
                entity.getIdempotencyKey(),
                entity.getPaidAt(),
                entity.getCreatedAt()
        );
    }

    public static List<PaymentResponse> toResponseList(List<Payment> entities) {
        return entities.stream().map(PaymentMapper::toResponse).toList();
    }
}
