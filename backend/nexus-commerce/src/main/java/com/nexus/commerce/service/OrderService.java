package com.nexus.commerce.service;

import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Đơn hàng — FR-23 (xem danh sách/chi tiết theo role), FR-24 (Seller đổi trạng thái),
 * FR-25 (huỷ đơn), FR-56 (Admin quản lý đơn).
 *
 * <p>Mọi method đều kiểm tra quyền sở hữu: Buyer chỉ thấy đơn của mình, Seller chỉ thấy đơn
 * có {@code sellerId} của mình, Admin thấy tất cả. Sai quyền → {@code ForbiddenOperationException}.</p>
 */
public interface OrderService {

    /** FR-23 — danh sách đơn của chính Buyer; {@code status} null ⇒ không lọc. */
    PageResponse<OrderSummaryResponse> listBuyerOrders(UUID buyerId, OrderStatus status, Pageable pageable);

    /** FR-23 — chi tiết đơn của chính Buyer. */
    OrderResponse getBuyerOrder(UUID buyerId, UUID orderId);

    /** FR-23 — danh sách đơn của chính Seller. */
    PageResponse<OrderSummaryResponse> listSellerOrders(UUID sellerId, OrderStatus status, Pageable pageable);

    /** FR-23 — chi tiết đơn thuộc Seller đang đăng nhập. */
    OrderResponse getSellerOrder(UUID sellerId, UUID orderId);

    /** FR-24 — Seller chuyển trạng thái theo chuỗi hợp lệ (chặn nhảy cóc/lùi/sai quyền). */
    OrderResponse updateStatusBySeller(UUID sellerId, UUID orderId, OrderStatus targetStatus);

    /** FR-25 — Buyer huỷ đơn của mình khi đơn chưa kết thúc. */
    OrderResponse cancelByBuyer(UUID buyerId, UUID orderId);

    /** FR-25 — Seller huỷ đơn của mình khi đơn chưa kết thúc. */
    OrderResponse cancelBySeller(UUID sellerId, UUID orderId);

    /** FR-56 — Admin xem mọi đơn; {@code buyerId}/{@code sellerId}/{@code status} null ⇒ bỏ qua bộ lọc đó. */
    PageResponse<OrderSummaryResponse> listOrdersForAdmin(UUID buyerId, UUID sellerId, OrderStatus status, Pageable pageable);

    /** FR-56 — Admin xem chi tiết bất kỳ đơn nào. */
    OrderResponse getOrderForAdmin(UUID orderId);

    /** FR-56 — Admin chuyển trạng thái đơn (vẫn phải tuân chuỗi trạng thái hợp lệ). */
    OrderResponse updateStatusByAdmin(UUID orderId, OrderStatus targetStatus);

    /** FR-25 — Admin huỷ đơn bất kỳ khi đơn chưa kết thúc. */
    OrderResponse cancelByAdmin(UUID orderId);
}
