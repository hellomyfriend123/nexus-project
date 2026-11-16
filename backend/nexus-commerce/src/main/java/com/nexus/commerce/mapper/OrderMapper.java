package com.nexus.commerce.mapper;

import com.nexus.commerce.dto.buyer.OrderItemResponse;
import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.entity.Order;
import com.nexus.commerce.entity.OrderItem;

import java.util.List;

/**
 * Mapper viết tay cho đơn hàng (§9).
 *
 * <p>Có hai biến thể {@code toResponse}: một bản nhận sẵn danh sách {@link OrderItem}
 * (service đã truy vấn) và một bản tra cứu qua repository — nhờ vậy {@link OrderMapper}
 * vẫn là lớp static thuần, không tự giữ state.</p>
 */
public final class OrderMapper {

    private OrderMapper() {
    }

    public static OrderItemResponse toItemResponse(OrderItem entity) {
        return new OrderItemResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSkuId(),
                entity.getSellerId(),
                entity.getProductNameSnapshot(),
                entity.getSkuCodeSnapshot(),
                entity.getQuantity(),
                MoneyUtils.money(entity.getUnitPrice()),
                MoneyUtils.money(entity.getSubtotal())
        );
    }

    public static List<OrderItemResponse> toItemResponseList(List<OrderItem> entities) {
        return entities.stream().map(OrderMapper::toItemResponse).toList();
    }

    public static OrderResponse toResponse(Order order, List<OrderItem> items) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getBuyerId(),
                order.getSellerId(),
                order.getOrderType() == null ? null : order.getOrderType().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                MoneyUtils.money(order.getSubtotal()),
                MoneyUtils.money(order.getDiscount()),
                MoneyUtils.money(order.getShippingFee()),
                MoneyUtils.money(order.getTotalAmount()),
                order.getShippingAddress(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getDiscountCode(),
                toItemResponseList(items),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    public static OrderSummaryResponse toSummaryResponse(Order order, int itemCount) {
        return new OrderSummaryResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getBuyerId(),
                order.getSellerId(),
                order.getOrderType() == null ? null : order.getOrderType().name(),
                order.getStatus() == null ? null : order.getStatus().name(),
                MoneyUtils.money(order.getTotalAmount()),
                itemCount,
                order.getCreatedAt()
        );
    }
}
