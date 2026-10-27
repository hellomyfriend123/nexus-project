package com.nexus.commerce.repository;

import com.nexus.commerce.entity.Cart;
import com.nexus.commerce.enums.CartStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn giỏ hàng (FR-15..FR-19). Không có soft delete nên không cần lọc {@code deletedAt}.
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    /**
     * FR-15: giỏ đang hoạt động của Buyer. DB có unique partial index
     * {@code ux_carts_buyer_active} nên tối đa một kết quả.
     */
    Optional<Cart> findByBuyerIdAndStatus(UUID buyerId, CartStatus status);

    /** Kiểm tra tồn tại giỏ ACTIVE — dùng để quyết định tạo mới. */
    boolean existsByBuyerIdAndStatus(UUID buyerId, CartStatus status);

    /** Tra cứu giỏ kèm kiểm tra chủ sở hữu (tránh lộ giỏ của Buyer khác). */
    Optional<Cart> findByIdAndBuyerId(UUID id, UUID buyerId);

    /** Danh sách giỏ của một Buyer (chủ yếu cho Admin tra soát — FR-56/58). */
    Page<Cart> findAllByBuyerId(UUID buyerId, Pageable pageable);
}
