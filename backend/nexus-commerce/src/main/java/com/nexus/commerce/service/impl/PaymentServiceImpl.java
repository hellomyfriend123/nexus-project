package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.CreatePaymentRequest;
import com.nexus.commerce.dto.buyer.PaymentResponse;
import com.nexus.commerce.entity.Order;
import com.nexus.commerce.entity.Payment;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.enums.PaymentStatus;
import com.nexus.commerce.mapper.MoneyUtils;
import com.nexus.commerce.mapper.PaymentMapper;
import com.nexus.commerce.repository.OrderRepository;
import com.nexus.commerce.repository.PaymentRepository;
import com.nexus.commerce.service.PaymentService;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Cài đặt thanh toán — FR-21.
 *
 * <p><b>Idempotent:</b> {@code idempotencyKey} là duy nhất (unique index
 * {@code ux_payments_idempotency_key}). Nếu khoá đã tồn tại, service trả lại bản ghi cũ và
 * KHÔNG tạo mới, KHÔNG trừ tiền lần hai — kể cả khi request lặp lại với số tiền khác.</p>
 *
 * <p><b>Không có {@code OrderStatus.PAID}</b> (§11.4): giao dịch SUCCESS chỉ đưa đơn
 * {@code PENDING → CONFIRMED}.</p>
 *
 * <p><b>TODO (business logic):</b> hiện là thanh toán giả lập trong nội bộ module; khi nối cổng
 * thanh toán thật thì {@code confirmPayment} phải xác thực chữ ký callback từ cổng, không nhận
 * {@code result} trực tiếp từ client.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    public PaymentResponse createPayment(UUID buyerId, UUID orderId, CreatePaymentRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu thanh toán");
        }
        if (request.paymentMethod() == null) {
            throw new BusinessException("Phương thức thanh toán không được để trống");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new BusinessException("Số tiền thanh toán phải lớn hơn 0");
        }
        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());

        // Kiểm tra quyền sở hữu TRƯỚC khi tra idempotencyKey: tránh trường hợp Buyer khác
        // đoán được khoá của người khác rồi đọc trộm giao dịch (thông tin rò rỉ chéo tài khoản).
        Order order = requireBuyerOrder(buyerId, orderId);

        // FR-21 — chống trừ tiền hai lần: khoá đã dùng thì trả lại giao dịch cũ, không tạo mới.
        Payment existing = paymentRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) {
            return PaymentMapper.toResponse(existing);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Đơn hàng đã bị huỷ, không thể thanh toán");
        }
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException("Đơn hàng đã hoàn tất, không cần thanh toán thêm");
        }
        if (paymentRepository.findFirstByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCESS).isPresent()) {
            throw new BusinessException("Đơn hàng đã có giao dịch thành công, không thể tạo giao dịch mới");
        }

        Payment payment = Payment.builder()
                .orderId(order.getId())
                .paymentMethod(request.paymentMethod())
                .paymentReference(null)
                .amount(MoneyUtils.money(request.amount()))
                .status(PaymentStatus.PENDING)
                .idempotencyKey(idempotencyKey)
                .paidAt(null)
                .build();

        return PaymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    public PaymentResponse confirmPayment(UUID buyerId, UUID paymentId, PaymentStatus result) {
        if (result == null || result == PaymentStatus.PENDING) {
            throw new BusinessException("Kết quả giao dịch chỉ nhận SUCCESS hoặc FAILED");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch thanh toán", paymentId));

        Order order = requireBuyerOrder(buyerId, payment.getOrderId());

        // Giao dịch đã ở trạng thái cuối: trả lại nguyên trạng (idempotent), không đổi dữ liệu.
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return PaymentMapper.toResponse(payment);
        }

        payment.setStatus(result);
        if (result == PaymentStatus.SUCCESS) {
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);

            // FR-24: KHÔNG có OrderStatus.PAID — thanh toán thành công chỉ xác nhận đơn.
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
        } else {
            paymentRepository.save(payment);
        }

        return PaymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> listOrderPayments(UUID buyerId, UUID orderId) {
        Order order = requireBuyerOrder(buyerId, orderId);
        return PaymentMapper.toResponseList(paymentRepository.findAllByOrderId(order.getId()));
    }

    // ------------------------------------------------------------------ nội bộ

    /** Lấy đơn và xác nhận đơn thuộc Buyer đang đăng nhập (403 nếu của người khác, 404 nếu không có). */
    private Order requireBuyerOrder(UUID buyerId, UUID orderId) {
        return orderRepository.findByIdAndBuyerId(orderId, buyerId).orElseGet(() -> {
            if (orderRepository.existsById(orderId)) {
                throw new ForbiddenOperationException("Đơn hàng không thuộc về Buyer đang đăng nhập");
            }
            throw new ResourceNotFoundException("Đơn hàng", orderId);
        });
    }

    /**
     * Chuẩn hoá khoá idempotency: bỏ khoảng trắng thừa và giới hạn theo độ dài cột (255).
     * Không đổi hoa/thường vì client có thể dùng UUID (đã phân biệt hoa thường).
     */
    private String normalizeIdempotencyKey(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException("idempotencyKey không được để trống");
        }
        String key = raw.trim();
        if (key.length() > 255) {
            throw new BusinessException("idempotencyKey tối đa 255 ký tự");
        }
        return key;
    }
}
