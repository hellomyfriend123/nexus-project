package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.AddCartItemRequest;
import com.nexus.commerce.dto.buyer.CartResponse;
import com.nexus.commerce.entity.Cart;
import com.nexus.commerce.entity.CartItem;
import com.nexus.commerce.enums.CartStatus;
import com.nexus.commerce.repository.CartItemRepository;
import com.nexus.commerce.repository.CartRepository;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ giỏ hàng (§14.1 — thuần Mockito, không Spring context, không DB).
 */
@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    @Test
    @DisplayName("FR-16: thêm cùng productId + skuId hai lần thì cộng dồn quantity, KHÔNG tạo dòng mới")
    void addItem_sameProductAndSku_accumulatesQuantity() {
        UUID buyerId = UUID.randomUUID();
        UUID cartId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID skuId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        Cart cart = Cart.builder()
                .buyerId(buyerId)
                .status(CartStatus.ACTIVE)
                .subtotal(BigDecimal.ZERO.setScale(2))
                .build();
        cart.setId(cartId);

        CartItem existingItem = CartItem.builder()
                .cartId(cartId)
                .productId(productId)
                .skuId(skuId)
                .sellerId(sellerId)
                .quantity(2)
                .unitPrice(new BigDecimal("10.00"))
                .build();
        existingItem.setId(UUID.randomUUID());

        when(cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndProductIdAndSkuId(cartId, productId, skuId))
                .thenReturn(Optional.of(existingItem));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartItemRepository.findAllByCartId(cartId)).thenReturn(List.of(existingItem));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddCartItemRequest request = new AddCartItemRequest(
                productId, skuId, sellerId, "Sản phẩm A", 3, new BigDecimal("10.00"));

        CartResponse response = cartService.addItem(buyerId, request);

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(5);
        assertThat(captor.getValue().getUnitPrice()).isEqualByComparingTo("10.00");
        assertThat(response.subtotal()).isEqualByComparingTo("50.00");
        assertThat(response.itemCount()).isEqualTo(1);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).quantity()).isEqualTo(5);
        assertThat(response.items().get(0).lineTotal()).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("FR-16: sản phẩm mới (khác skuId) thì tạo dòng hàng mới")
    void addItem_newProduct_createsNewItem() {
        UUID buyerId = UUID.randomUUID();
        UUID cartId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID skuId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();

        Cart cart = Cart.builder()
                .buyerId(buyerId)
                .status(CartStatus.ACTIVE)
                .subtotal(BigDecimal.ZERO.setScale(2))
                .build();
        cart.setId(cartId);

        when(cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)).thenReturn(Optional.of(cart));
        // Không cần stub find...: Optional mặc định là empty ⇒ service đi nhánh tạo dòng hàng mới.
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartItemRepository.findAllByCartId(cartId)).thenReturn(List.of());
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartResponse response = cartService.addItem(buyerId,
                new AddCartItemRequest(productId, skuId, sellerId, "Sản phẩm B", 1, new BigDecimal("20.00")));

        ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
        verify(cartItemRepository).save(captor.capture());
        assertThat(captor.getValue().getQuantity()).isEqualTo(1);
        assertThat(response.subtotal()).isEqualByComparingTo("0.00");
        assertThat(response.items()).isEmpty();
    }

    @Test
    @DisplayName("FR-16: quantity <= 0 thì ném BusinessException và KHÔNG ghi gì xuống DB")
    void addItem_nonPositiveQuantity_throwsBusinessException() {
        UUID buyerId = UUID.randomUUID();
        AddCartItemRequest request = new AddCartItemRequest(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Sản phẩm C", 0, new BigDecimal("10.00"));

        assertThatThrownBy(() -> cartService.addItem(buyerId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Số lượng");

        verify(cartItemRepository, never()).save(any(CartItem.class));
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    @DisplayName("FR-16: unitPrice <= 0 thì ném BusinessException")
    void addItem_nonPositiveUnitPrice_throwsBusinessException() {
        AddCartItemRequest request = new AddCartItemRequest(
                UUID.randomUUID(), null, UUID.randomUUID(), "Sản phẩm D", 1, BigDecimal.ZERO);

        assertThatThrownBy(() -> cartService.addItem(UUID.randomUUID(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Đơn giá");
    }

    @Test
    @DisplayName("FR-15: chưa có giỏ ACTIVE thì tạo giỏ mới với subtotal 0")
    void getOrCreateActiveCart_noActiveCart_createsNewCart() {
        UUID buyerId = UUID.randomUUID();
        when(cartRepository.findByBuyerIdAndStatus(buyerId, CartStatus.ACTIVE)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartItemRepository.findAllByCartId(any())).thenReturn(List.of());

        CartResponse response = cartService.getOrCreateActiveCart(buyerId);

        assertThat(response.status()).isEqualTo(CartStatus.ACTIVE.name());
        assertThat(response.buyerId()).isEqualTo(buyerId);
        assertThat(response.subtotal()).isEqualByComparingTo("0.00");
        assertThat(response.items()).isEmpty();
        verify(cartRepository).save(any(Cart.class));
    }
}
