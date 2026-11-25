package com.nexus.commerce.repository;

import com.nexus.commerce.entity.Order;
import com.nexus.commerce.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn đơn hàng (FR-23, FR-25, FR-56).
 * Không hard delete nên không có cột {@code deletedAt}; đơn bị huỷ vẫn tra cứu được với {@code status = CANCELLED}.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    // ---------------------------------------------------------------- Buyer (FR-23)

    Page<Order> findAllByBuyerId(UUID buyerId, Pageable pageable);

    Page<Order> findAllByBuyerIdAndStatus(UUID buyerId, OrderStatus status, Pageable pageable);

    Optional<Order> findByIdAndBuyerId(UUID id, UUID buyerId);

    // --------------------------------------------------------------- Seller (FR-23)

    Page<Order> findAllBySellerId(UUID sellerId, Pageable pageable);

    Page<Order> findAllBySellerIdAndStatus(UUID sellerId, OrderStatus status, Pageable pageable);

    Optional<Order> findByIdAndSellerId(UUID id, UUID sellerId);

    // ---------------------------------------------------------------- Admin (FR-56)

    Page<Order> findAllByStatus(OrderStatus status, Pageable pageable);
}
