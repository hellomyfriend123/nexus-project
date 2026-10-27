package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.CheckoutRequest;
import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.entity.Cart;
import com.nexus.commerce.entity.CartItem;
import com.nexus.commerce.entity.DiscountCode;
import com.nexus.commerce.entity.Order;
import com.nexus.commerce.entity.OrderItem;
import com.nexus.commerce.enums.CartStatus;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.enums.OrderType;
import com.nexus.commerce.mapper.CartMapper;
import com.nexus.commerce.mapper.MoneyUtils;
import com.nexus.commerce.mapper.OrderMapper;
import com.nexus.commerce.repository.CartItemRepository;
import com.nexus.commerce.repository.CartRepository;
import com.nexus.commerce.repository.OrderItemRepository;
import com.nexus.commerce.repository.OrderRepository;
import com.nexus.commerce.service.CheckoutService;
import com.nexus.commerce.service.PromotionService;
import com.nexus.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Cài đặt checkout — FR-19 (đặt hàng) và FR-22 (sinh Order + OrderItem).
 *
 * <p><b>Giới hạn MVP:</b> một đơn chỉ thuộc MỘT Seller. Nếu giỏ có hàng của nhiều Seller,
 * checkout bị chặn bằng {@code BusinessException} (thông báo ghi rõ đây là giới hạn của MVP).
 * Hệ quả là Buyer phải tách giỏ theo Seller — ghi nhận để làm ở giai đoạn business logic
 * (tách đơn theo Seller khi có yêu cầu).</p>
 *
 * <p><b>Công thức tiền:</b> {@code totalAmount = subtotal - discount + shippingFee}, mọi bước
 * làm tròn {@code setScale(2, HALF_UP)}.</p>
 *
 * <p><b>Phí vận chuyển:</b> giai đoạn CRUD chưa có module tính phí (Fulfillment chưa được nối)
 * nên tạm đặt 0.00; cấu hình/địa chỉ giao hàng chỉ được lưu làm snapshot.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CheckoutServiceImpl implements CheckoutService {

    /** Bảng chữ-số sinh hậu tố đơn hàng; {@link SecureRandom} để tránh trùng khi nhiều request song song. */
    private static final String ORDER_NUMBER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ORDER_NUMBER_SUFFIX_LENGTH = 6;
    private static final DateTimeFormatter ORDER_NUMBER_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int MAX_ORDER_NUMBER_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PromotionService promotionService;

    @Override
    public OrderResponse checkout(UUID buyerId, CheckoutRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu checkout");
        }

        Cart cart = cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException("Buyer chưa có giỏ hàng đang hoạt động để thanh toán"));

        List<CartItem> cartItems = cartItemRepository.findAllByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BusinessException("Giỏ hàng đang trống, không thể đặt hàng");
        }

        UUID sellerId = resolveSingleSellerId(cartItems);

        // Snapshot dòng hàng: tên và giá được chốt tại thời điểm đặt.
        // TODO (business logic): giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi Fulfillment.
        //       Hiện nhận từ request để phục vụ giai đoạn CRUD.
        BigDecimal subtotal = CartMapper.calculateSubtotal(cartItems);

        BigDecimal discount = BigDecimal.ZERO.setScale(MoneyUtils.SCALE);
        DiscountCode appliedCode = null;
        if (request.discountCode() != null && !request.discountCode().isBlank()) {
            appliedCode = promotionService.resolveForCheckout(request.discountCode(), subtotal);
            discount = promotionService.calculateDiscountAmount(appliedCode, subtotal);
        }

        // TODO (business logic): phí vận chuyển phải lấy từ Fulfillment (theo kho/địa chỉ).
        //       Giai đoạn CRUD chưa nối module nên tạm để 0.00.
        BigDecimal shippingFee = BigDecimal.ZERO.setScale(MoneyUtils.SCALE);
        BigDecimal totalAmount = MoneyUtils.money(subtotal.subtract(discount).add(shippingFee));

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .buyerId(buyerId)
                .sellerId(sellerId)
                .orderType(OrderType.DIRECT)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .discount(discount)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .shippingAddress(request.shippingAddress())
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .discountCode(appliedCode == null ? null : appliedCode.getCode())
                .build();
        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>(cartItems.size());
        for (CartItem cartItem : cartItems) {
            orderItems.add(OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .productId(cartItem.getProductId())
                    .skuId(cartItem.getSkuId())
                    .sellerId(cartItem.getSellerId())
                    // Snapshot tên sản phẩm: Catalog chưa được nối nên dùng tạm productId làm nhãn hiển thị.
                    // TODO (business logic): giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi Fulfillment.
                    //       Hiện nhận từ request để phục vụ giai đoạn CRUD.
                    .productNameSnapshot(resolveProductNameSnapshot(cartItem))
                    .skuCodeSnapshot(null)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(MoneyUtils.money(cartItem.getUnitPrice()))
                    .subtotal(MoneyUtils.money(cartItem.lineTotal()))
                    .build());
        }
        orderItemRepository.saveAll(orderItems);

        // FR-19: giỏ đã chuyển thành đơn ⇒ không dùng lại nữa.
        cart.setStatus(CartStatus.CONVERTED);
        cartRepository.save(cart);

        // FR-20/48: chỉ tăng lượt dùng khi checkout thành công.
        if (appliedCode != null) {
            promotionService.registerUsage(appliedCode);
        }

        return OrderMapper.toResponse(savedOrder, orderItems);
    }

    // ------------------------------------------------------------------ nội bộ

    /**
     * Giới hạn MVP: mỗi đơn chỉ một Seller. Giỏ có nhiều Seller ⇒ chặn và nói rõ lý do.
     */
    private UUID resolveSingleSellerId(List<CartItem> cartItems) {
        Set<UUID> sellerIds = new LinkedHashSet<>();
        for (CartItem item : cartItems) {
            if (item.getSellerId() != null) {
                sellerIds.add(item.getSellerId());
            }
        }
        if (sellerIds.isEmpty()) {
            throw new BusinessException("Không xác định được Seller của các sản phẩm trong giỏ hàng");
        }
        if (sellerIds.size() > 1) {
            throw new BusinessException(
                    "Giỏ hàng có sản phẩm từ nhiều Seller. Đây là giới hạn của MVP (mỗi đơn chỉ thuộc một Seller) — "
                            + "vui lòng tách giỏ hàng theo từng Seller rồi đặt hàng lại.");
        }
        return sellerIds.iterator().next();
    }

    /**
     * Sinh mã đơn dạng {@code ORD-yyyyMMdd-XXXXXX}, kiểm tra trùng trong DB.
     * Bảng {@code orders} có unique index trên {@code order_number} nên đây là lớp bảo vệ thứ hai.
     */
    private String generateOrderNumber() {
        String datePart = LocalDate.now(ZoneId.systemDefault()).format(ORDER_NUMBER_DATE);
        for (int attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
            String candidate = "ORD-" + datePart + "-" + randomSuffix();
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException("Không sinh được mã đơn hàng duy nhất, vui lòng thử lại");
    }

    private String randomSuffix() {
        StringBuilder suffix = new StringBuilder(ORDER_NUMBER_SUFFIX_LENGTH);
        for (int i = 0; i < ORDER_NUMBER_SUFFIX_LENGTH; i++) {
            suffix.append(ORDER_NUMBER_CHARS.charAt(RANDOM.nextInt(ORDER_NUMBER_CHARS.length())));
        }
        return suffix.toString();
    }

    /**
     * Tên sản phẩm để snapshot. Giai đoạn CRUD chưa nối Catalog và {@code cart_items} không lưu tên,
     * nên dùng productId làm nhãn tạm — KHÔNG được coi là dữ liệu cuối cùng.
     */
    private String resolveProductNameSnapshot(CartItem cartItem) {
        String productId = cartItem.getProductId() == null ? "không xác định" : cartItem.getProductId().toString();
        return "Sản phẩm " + productId;
    }
}
