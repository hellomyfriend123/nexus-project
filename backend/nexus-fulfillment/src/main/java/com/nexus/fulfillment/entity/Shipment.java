package com.nexus.fulfillment.entity;

import com.nexus.common.entity.BaseEntity;
import com.nexus.fulfillment.enums.ShipmentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Vận đơn gắn với một Order — bảng {@code nexus_fulfillment.shipments} (§16).
 * <p>
 * {@code orderId}, {@code sellerId}, {@code warehouseId} đều là tham chiếu chéo module
 * (nexus-commerce, nexus-user) → chỉ dùng {@code UUID} trần, không quan hệ JPA.
 * Không hard delete.
 */
@Entity
@Table(name = "shipments", schema = "nexus_fulfillment")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment extends BaseEntity {

    /** Tham chiếu chéo module → Order.id (nexus_commerce.orders). Bắt buộc. */
    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    /** Kho xuất hàng (tuỳ chọn) → Warehouse.id. */
    @Column(name = "warehouse_id")
    private UUID warehouseId;

    /** Seller chịu trách nhiệm giao hàng → User.id. Lấy từ token, không nhận từ client. */
    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;

    /** Mã vận đơn nhập tay (đối tác giao hàng cấp). */
    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ShipmentStatus status;
}
