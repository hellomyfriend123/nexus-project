package com.nexus.commerce.service;

import com.nexus.commerce.dto.buyer.CreatePaymentRequest;
import com.nexus.commerce.dto.buyer.PaymentResponse;
import com.nexus.commerce.enums.PaymentStatus;

import java.util.List;
import java.util.UUID;

/**
 * Thanh toán — FR-21.
 *
 * <p>Lưu ý nghiệp vụ: {@code OrderStatus} KHÔNG có {@code PAID} (§11.4). Khi giao dịch thành công,
 * đơn chỉ chuyển từ {@code PENDING} sang {@code CONFIRMED}.</p>
 */
public interface PaymentService {

    /**
     * FR-21 — tạo (hoặc trả lại) giao dịch thanh toán cho một đơn của Buyer.
     * <b>Idempotent theo {@code idempotencyKey}</b>: khoá đã tồn tại ⇒ trả bản ghi cũ, không tạo mới.
     */
    PaymentResponse createPayment(UUID buyerId, UUID orderId, CreatePaymentRequest request);

    /** FR-21 — xác nhận kết quả giao dịch; SUCCESS ⇒ set {@code paidAt} và đơn chuyển {@code CONFIRMED}. */
    PaymentResponse confirmPayment(UUID buyerId, UUID paymentId, PaymentStatus result);

    /** Danh sách giao dịch của một đơn (chỉ chủ đơn xem được). */
    List<PaymentResponse> listOrderPayments(UUID buyerId, UUID orderId);
}
