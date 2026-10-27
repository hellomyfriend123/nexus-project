package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

    /** FR-40 — Buyer xem vận đơn theo đơn hàng (mới nhất trước). */
    List<Shipment> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    /** Vận đơn của một Seller (dùng cho màn hình quản lý ở giai đoạn sau). */
    Page<Shipment> findAllBySellerId(UUID sellerId, Pageable pageable);
}
