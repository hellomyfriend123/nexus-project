package com.nexus.commerce.repository;

import com.nexus.commerce.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Truy vấn dòng hàng của đơn (FR-22, FR-23).
 * Không hard delete: order_item là bất biến sau khi tạo (snapshot), xoá đơn là hành vi không có trong nghiệp vụ.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findAllByOrderId(UUID orderId);

    /** Dùng khi cần dựng OrderResponse cho nhiều đơn (tránh N+1 nếu sau này cần tối ưu). */
    List<OrderItem> findAllByOrderIdIn(List<UUID> orderIds);

    long countByOrderId(UUID orderId);

    boolean existsByOrderIdAndProductId(UUID orderId, UUID productId);
}
