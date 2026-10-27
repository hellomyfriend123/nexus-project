package com.nexus.commerce.mapper;

import com.nexus.commerce.dto.buyer.CartItemResponse;
import com.nexus.commerce.dto.buyer.CartResponse;
import com.nexus.commerce.entity.Cart;
import com.nexus.commerce.entity.CartItem;

import java.math.BigDecimal;
import java.util.List;

/**
 * Mapper viết tay cho giỏ hàng (§9 — không dùng MapStruct, không reflection).
 */
public final class CartMapper {

    private CartMapper() {
    }

    public static CartItemResponse toItemResponse(CartItem entity) {
        BigDecimal unitPrice = MoneyUtils.money(entity.getUnitPrice());
        BigDecimal lineTotal = MoneyUtils.money(unitPrice.multiply(BigDecimal.valueOf(
                entity.getQuantity() == null ? 0 : entity.getQuantity())));
        return new CartItemResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSkuId(),
                entity.getSellerId(),
                entity.getQuantity(),
                unitPrice,
                lineTotal
        );
    }

    public static List<CartItemResponse> toItemResponseList(List<CartItem> entities) {
        return entities.stream().map(CartMapper::toItemResponse).toList();
    }

    public static CartResponse toResponse(Cart cart, List<CartItem> items) {
        List<CartItemResponse> itemResponses = toItemResponseList(items);
        return new CartResponse(
                cart.getId(),
                cart.getBuyerId(),
                cart.getStatus() == null ? null : cart.getStatus().name(),
                MoneyUtils.money(cart.getSubtotal()),
                itemResponses.size(),
                itemResponses,
                cart.getCreatedAt(),
                cart.getUpdatedAt()
        );
    }

    /**
     * Tổng tiền hàng của giỏ = Σ (unitPrice × quantity), làm tròn HALF_UP 2 chữ số.
     * Dùng chung cho {@code subtotal} của cart và {@code subtotal} của order khi checkout.
     */
    public static BigDecimal calculateSubtotal(List<CartItem> items) {
        // MoneyUtils.money đã làm tròn setScale(2, HALF_UP) — không cần setScale lần hai.
        return MoneyUtils.money(items.stream()
                .map(CartItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }
}
