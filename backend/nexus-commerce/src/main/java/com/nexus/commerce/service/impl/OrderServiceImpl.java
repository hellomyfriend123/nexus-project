package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.entity.Order;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.mapper.OrderMapper;
import com.nexus.commerce.repository.OrderItemRepository;
import com.nexus.commerce.repository.OrderRepository;
import com.nexus.commerce.service.OrderService;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Cài đặt đơn hàng — FR-23 (xem đơn), FR-24 (Seller đổi trạng thái), FR-25 (huỷ đơn), FR-56 (Admin).
 *
 * <p><b>Kiểm tra quyền sở hữu làm ngay trong giai đoạn CRUD:</b> Buyer/Seller chỉ truy cập được đơn
 * thuộc về mình; sai chủ sở hữu ⇒ {@code ForbiddenOperationException} (403), không tồn tại ⇒ 404.</p>
 *
 * <p><b>Luật chuyển trạng thái (FR-24):</b> chỉ tiến một bước trong chuỗi
 * {@code PENDING → CONFIRMED → SHIPPING → COMPLETED}, hoặc sang {@code CANCELLED} khi đơn chưa kết thúc.
 * Nhảy cóc và lùi đều bị chặn. Admin cũng phải tuân luật này (FR-56 không cho phá vỡ vòng đời đơn).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    // ------------------------------------------------------------------ Buyer

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listBuyerOrders(UUID buyerId, OrderStatus status, Pageable pageable) {
        Page<Order> page = status == null
                ? orderRepository.findAllByBuyerId(buyerId, pageable)
                : orderRepository.findAllByBuyerIdAndStatus(buyerId, status, pageable);
        return PageResponse.from(page, this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getBuyerOrder(UUID buyerId, UUID orderId) {
        Order order = orderRepository.findByIdAndBuyerId(orderId, buyerId)
                .orElseGet(() -> throwNotFoundOrForbidden(orderId, true));
        return OrderMapper.toResponse(order, orderItemRepository.findAllByOrderId(order.getId()));
    }

    @Override
    public OrderResponse cancelByBuyer(UUID buyerId, UUID orderId) {
        Order order = orderRepository.findByIdAndBuyerId(orderId, buyerId)
                .orElseGet(() -> throwNotFoundOrForbidden(orderId, true));
        return cancel(order);
    }

    // ----------------------------------------------------------------- Seller

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listSellerOrders(UUID sellerId, OrderStatus status, Pageable pageable) {
        Page<Order> page = status == null
                ? orderRepository.findAllBySellerId(sellerId, pageable)
                : orderRepository.findAllBySellerIdAndStatus(sellerId, status, pageable);
        return PageResponse.from(page, this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getSellerOrder(UUID sellerId, UUID orderId) {
        Order order = orderRepository.findByIdAndSellerId(orderId, sellerId)
                .orElseGet(() -> throwNotFoundOrForbidden(orderId, false));
        return OrderMapper.toResponse(order, orderItemRepository.findAllByOrderId(order.getId()));
    }

    @Override
    public OrderResponse updateStatusBySeller(UUID sellerId, UUID orderId, OrderStatus targetStatus) {
        Order order = orderRepository.findByIdAndSellerId(orderId, sellerId)
                .orElseGet(() -> throwNotFoundOrForbidden(orderId, false));
        return applyTransition(order, targetStatus, sellerId);
    }

    @Override
    public OrderResponse cancelBySeller(UUID sellerId, UUID orderId) {
        Order order = orderRepository.findByIdAndSellerId(orderId, sellerId)
                .orElseGet(() -> throwNotFoundOrForbidden(orderId, false));
        return cancel(order);
    }

    // ------------------------------------------------------------------ Admin

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listOrdersForAdmin(UUID buyerId, UUID sellerId, OrderStatus status,
                                                                 Pageable pageable) {
        Page<Order> page;
        if (buyerId != null && status != null) {
            page = orderRepository.findAllByBuyerIdAndStatus(buyerId, status, pageable);
        } else if (sellerId != null && status != null) {
            page = orderRepository.findAllBySellerIdAndStatus(sellerId, status, pageable);
        } else if (buyerId != null) {
            page = orderRepository.findAllByBuyerId(buyerId, pageable);
        } else if (sellerId != null) {
            page = orderRepository.findAllBySellerId(sellerId, pageable);
        } else if (status != null) {
            page = orderRepository.findAllByStatus(status, pageable);
        } else {
            page = orderRepository.findAll(pageable);
        }
        return PageResponse.from(page, this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderForAdmin(UUID orderId) {
        Order order = requireOrder(orderId);
        return OrderMapper.toResponse(order, orderItemRepository.findAllByOrderId(order.getId()));
    }

    @Override
    public OrderResponse updateStatusByAdmin(UUID orderId, OrderStatus targetStatus) {
        Order order = requireOrder(orderId);
        // Admin không bị ràng buộc chủ sở hữu (requiredSellerId = null) nhưng vẫn phải tuân chuỗi trạng thái.
        return applyTransition(order, targetStatus, null);
    }

    @Override
    public OrderResponse cancelByAdmin(UUID orderId) {
        return cancel(requireOrder(orderId));
    }

    // ------------------------------------------------------------------ nội bộ

    private Order requireOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng", orderId));
    }

    /**
     * FR-24 — kiểm tra chủ sở hữu (nếu có yêu cầu) và chuỗi trạng thái, rồi cập nhật.
     *
     * @param requiredSellerId Seller bắt buộc phải là chủ đơn; {@code null} khi Admin thao tác.
     */
    private OrderResponse applyTransition(Order order, OrderStatus targetStatus, UUID requiredSellerId) {
        if (requiredSellerId != null && !requiredSellerId.equals(order.getSellerId())) {
            throw new ForbiddenOperationException("Seller không phải chủ đơn hàng này");
        }
        if (targetStatus == null) {
            throw new BusinessException("Trạng thái đơn hàng không được để trống");
        }

        OrderStatus current = order.getStatus();
        if (current == null) {
            throw new BusinessException("Đơn hàng không có trạng thái hợp lệ");
        }
        if (current.isTerminal()) {
            throw new BusinessException("Đơn hàng đã ở trạng thái kết thúc (" + current
                    + "), không thể đổi sang " + targetStatus);
        }
        if (!current.canTransitionTo(targetStatus)) {
            throw new BusinessException("Chuyển trạng thái không hợp lệ: " + current + " → " + targetStatus
                    + ". Chỉ cho phép tiến một bước theo chuỗi PENDING → CONFIRMED → SHIPPING → COMPLETED, "
                    + "hoặc huỷ đơn (CANCELLED) khi đơn chưa kết thúc.");
        }

        order.setStatus(targetStatus);
        return OrderMapper.toResponse(orderRepository.save(order), orderItemRepository.findAllByOrderId(order.getId()));
    }

    /**
     * FR-25 — huỷ đơn (Buyer/Seller/Admin). Chỉ huỷ được khi đơn chưa kết thúc.
     *
     * <p><b>TODO (business logic):</b> FR-25 yêu cầu cập nhật lại inventory — thực hiện ở giai đoạn
     * business logic khi nối module fulfillment (hoàn lại {@code available_quantity} cho các SKU trong đơn).</p>
     */
    private OrderResponse cancel(Order order) {
        OrderStatus current = order.getStatus();
        if (current == null) {
            throw new BusinessException("Đơn hàng không có trạng thái hợp lệ");
        }
        if (current.isTerminal()) {
            throw new BusinessException("Đơn hàng ở trạng thái " + current + " nên không thể huỷ");
        }

        // TODO (business logic): FR-25 yêu cầu cập nhật lại inventory — thực hiện ở giai đoạn business logic
        //       khi nối module fulfillment (hoàn lại available_quantity cho các SKU trong đơn).
        order.setStatus(OrderStatus.CANCELLED);
        return OrderMapper.toResponse(orderRepository.save(order), orderItemRepository.findAllByOrderId(order.getId()));
    }

    /**
     * Không tìm thấy đơn theo chủ sở hữu. Nếu đơn <b>tồn tại nhưng thuộc người khác</b> thì trả 403
     * (đúng ngữ nghĩa {@code ForbiddenOperationException}); nếu không tồn tại thì trả 404.
     */
    private Order throwNotFoundOrForbidden(UUID orderId, boolean buyerSide) {
        if (orderRepository.existsById(orderId)) {
            throw new ForbiddenOperationException(buyerSide
                    ? "Đơn hàng không thuộc về Buyer đang đăng nhập"
                    : "Đơn hàng không thuộc về Seller đang đăng nhập");
        }
        throw new ResourceNotFoundException("Đơn hàng", orderId);
    }

    private OrderSummaryResponse toSummary(Order order) {
        int itemCount = (int) orderItemRepository.countByOrderId(order.getId());
        return OrderMapper.toSummaryResponse(order, itemCount);
    }
}
