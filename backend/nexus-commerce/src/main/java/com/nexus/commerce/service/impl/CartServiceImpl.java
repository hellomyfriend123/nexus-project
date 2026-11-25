package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.AddCartItemRequest;
import com.nexus.commerce.dto.buyer.CartResponse;
import com.nexus.commerce.dto.buyer.UpdateCartItemRequest;
import com.nexus.commerce.entity.Cart;
import com.nexus.commerce.entity.CartItem;
import com.nexus.commerce.enums.CartStatus;
import com.nexus.commerce.mapper.CartMapper;
import com.nexus.commerce.mapper.MoneyUtils;
import com.nexus.commerce.repository.CartItemRepository;
import com.nexus.commerce.repository.CartRepository;
import com.nexus.commerce.service.CartService;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Cài đặt giỏ hàng — FR-15 → FR-18.
 *
 * <p><b>Các quyết định đã chốt:</b></p>
 * <ul>
 *     <li>Bất biến "mỗi Buyer chỉ một cart ACTIVE" được giữ ở service và được DB bảo vệ thêm
 *         bằng unique partial index {@code ux_carts_buyer_active}.</li>
 *     <li>FR-16: trùng {@code productId + skuId} ⇒ cộng dồn quantity (không tạo dòng mới).</li>
 *     <li>Mọi thao tác ghi đều tính lại {@code subtotal} của cart từ danh sách dòng hàng.</li>
 *     <li>Xoá dòng hàng là xoá thật: giỏ là dữ liệu tạm, không nằm trong danh sách "không hard delete" (§11.6).</li>
 * </ul>
 *
 * <p><b>TODO (business logic):</b> giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi
 * Fulfillment. Hiện nhận từ request để phục vụ giai đoạn CRUD.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Override
    public CartResponse getOrCreateActiveCart(UUID buyerId) {
        Cart cart = findOrCreateActiveCart(buyerId);
        return CartMapper.toResponse(cart, cartItemRepository.findAllByCartId(cart.getId()));
    }

    @Override
    public CartResponse addItem(UUID buyerId, AddCartItemRequest request) {
        validateAddRequest(request);

        Cart cart = findOrCreateActiveCart(buyerId);

        // FR-16: đã có dòng cùng productId + skuId ⇒ cộng dồn số lượng.
        // Lưu ý: derived query với `skuId = null` không bao giờ khớp trong SQL,
        // nên trường hợp sản phẩm không có SKU phải tìm bằng `SkuIdIsNull`.
        Optional<CartItem> existing = request.skuId() == null
                ? cartItemRepository.findFirstByCartIdAndProductIdAndSkuIdIsNull(cart.getId(), request.productId())
                : cartItemRepository.findByCartIdAndProductIdAndSkuId(cart.getId(), request.productId(), request.skuId());

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQuantity = (item.getQuantity() == null ? 0 : item.getQuantity()) + request.quantity();
            if (newQuantity <= 0) {
                // Chặn tràn số nguyên (Integer overflow) — không để quantity âm lọt vào DB.
                throw new BusinessException("Số lượng vượt giới hạn cho phép của một dòng hàng");
            }
            item.setQuantity(newQuantity);
            // Giá mới nhất client gửi lên được dùng làm snapshot mới của dòng hàng.
            // TODO (business logic): giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi Fulfillment.
            //       Hiện nhận từ request để phục vụ giai đoạn CRUD.
            item.setUnitPrice(MoneyUtils.money(request.unitPrice()));
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cartId(cart.getId())
                    .productId(request.productId())
                    // TODO (business logic): giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi Fulfillment.
                    //       Hiện nhận từ request để phục vụ giai đoạn CRUD.
                    .skuId(request.skuId())
                    .sellerId(request.sellerId())
                    .quantity(request.quantity())
                    .unitPrice(MoneyUtils.money(request.unitPrice()))
                    .build();
            cartItemRepository.save(item);
        }

        return CartMapper.toResponse(cart, recalculateSubtotal(cart));
    }

    @Override
    public CartResponse updateItem(UUID buyerId, UUID itemId, UpdateCartItemRequest request) {
        if (request == null || request.quantity() == null || request.quantity() <= 0) {
            throw new BusinessException("Số lượng sản phẩm phải lớn hơn 0");
        }

        Cart cart = requireActiveCart(buyerId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dòng hàng trong giỏ", itemId));

        item.setQuantity(request.quantity());
        cartItemRepository.save(item);

        return CartMapper.toResponse(cart, recalculateSubtotal(cart));
    }

    @Override
    public CartResponse removeItem(UUID buyerId, UUID itemId) {
        Cart cart = requireActiveCart(buyerId);
        CartItem item = cartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dòng hàng trong giỏ", itemId));

        cartItemRepository.delete(item);
        return CartMapper.toResponse(cart, recalculateSubtotal(cart));
    }

    // ------------------------------------------------------------------ nội bộ

    /**
     * FR-15 — lấy cart ACTIVE, tạo mới nếu chưa có.
     * Cũng dùng bởi {@code CheckoutServiceImpl} để lấy giỏ cần thanh toán.
     */
    private Cart findOrCreateActiveCart(UUID buyerId) {
        return cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .buyerId(buyerId)
                        .status(CartStatus.ACTIVE)
                        .subtotal(BigDecimal.ZERO.setScale(2))
                        .build()));
    }

    /** Lấy cart ACTIVE bắt buộc phải có (dùng cho sửa/xoá dòng hàng). */
    private Cart requireActiveCart(UUID buyerId) {
        return cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException("Buyer chưa có giỏ hàng đang hoạt động"));
    }

    /** Tính lại subtotal của cart từ DB (không tin số liệu client) và lưu lại. */
    private List<CartItem> recalculateSubtotal(Cart cart) {
        List<CartItem> items = cartItemRepository.findAllByCartId(cart.getId());
        cart.setSubtotal(CartMapper.calculateSubtotal(items));
        cartRepository.save(cart);
        return items;
    }

    /** Validation bổ sung cho FR-16 (ngoài annotation trên DTO). */
    private void validateAddRequest(AddCartItemRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu thêm vào giỏ hàng");
        }
        if (request.quantity() == null || request.quantity() <= 0) {
            throw new BusinessException("Số lượng sản phẩm phải lớn hơn 0");
        }
        if (request.unitPrice() == null || request.unitPrice().signum() <= 0) {
            throw new BusinessException("Đơn giá sản phẩm phải lớn hơn 0");
        }
        if (request.productId() == null || request.sellerId() == null) {
            throw new BusinessException("Thiếu productId hoặc sellerId của sản phẩm");
        }
    }
}
