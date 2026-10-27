package com.nexus.commerce.repository;

import com.nexus.commerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn dòng hàng trong giỏ (FR-16/17/18).
 *
 * <p>FR-16: "đã có item cùng productId + skuId thì cộng dồn quantity" ⇒ cần
 * {@link #findByCartIdAndProductIdAndSkuId}. Vì {@code skuId} có thể null, service phải
 * xử lý riêng trường hợp null (derived query {@code = null} không bao giờ khớp trong SQL).</p>
 */
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    /** Tìm dòng hàng theo giỏ + sản phẩm + SKU (SKU khác null). */
    Optional<CartItem> findByCartIdAndProductIdAndSkuId(UUID cartId, UUID productId, UUID skuId);

    /** Tìm dòng hàng theo giỏ + sản phẩm khi sản phẩm không có SKU ({@code skuId IS NULL}). */
    Optional<CartItem> findFirstByCartIdAndProductIdAndSkuIdIsNull(UUID cartId, UUID productId);

    /** Toàn bộ dòng hàng của giỏ — dùng để tính lại subtotal và để checkout. */
    List<CartItem> findAllByCartId(UUID cartId);

    /** Lấy dòng hàng kèm kiểm tra thuộc đúng giỏ (chống sửa/xoá item của giỏ người khác). */
    Optional<CartItem> findByIdAndCartId(UUID id, UUID cartId);

    long countByCartId(UUID cartId);

    void deleteAllByCartId(UUID cartId);
}
