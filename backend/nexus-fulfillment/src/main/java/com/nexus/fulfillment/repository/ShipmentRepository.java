package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

    /** FR-40 — Buyer xem vận đơn theo đơn hàng (mới nhất trước). */
    List<Shipment> findAllByOrderIdOrderByCreatedAtDesc(UUID orderId);

    /** Vận đơn của một Seller (dùng cho màn hình quản lý ở giai đoạn sau). */
    Page<Shipment> findAllBySellerId(UUID sellerId, Pageable pageable);

    /** Lớp bảo vệ thứ hai khi sinh mã vận đơn (unique index là lớp cuối). */
    boolean existsByTrackingNumber(String trackingNumber);

    /**
     * Các mã vận đơn hiện có bắt đầu bằng {@code prefix} — dùng để sinh số thứ tự kế tiếp.
     * Chỉ lấy đúng cột {@code tracking_number} vì đây là truy vấn phục vụ sinh mã.
     */
    @Query("select s.trackingNumber from Shipment s where s.trackingNumber like concat(:prefix, '%')")
    List<String> findTrackingNumbersStartingWith(@Param("prefix") String prefix);
}
