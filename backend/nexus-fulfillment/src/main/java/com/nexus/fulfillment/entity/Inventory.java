package com.nexus.fulfillment.entity;

import com.nexus.common.entity.BaseEntity;
import com.nexus.fulfillment.enums.InventoryStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Tồn kho của một SKU tại một kho — bảng {@code nexus_fulfillment.inventories} (§16).
 * <ul>
 *     <li>Ràng buộc duy nhất {@code (sku_id, warehouse_id)}: mỗi cặp SKU–kho chỉ có một bản ghi.</li>
 *     <li>{@link Version} dùng cho optimistic locking — chuẩn bị cho giai đoạn business logic
 *         (nhiều Buyer trừ kho đồng thời khi checkout).</li>
 *     <li>Không hard delete: hết hàng thì {@code status = OUT_OF_STOCK}.</li>
 * </ul>
 * {@code Sku} là quan hệ <b>trong cùng module</b> nên {@code @ManyToOne} được phép (§4.10).
 * {@code warehouseId} giữ ở dạng {@code UUID} trần để không phải join khi chỉ cần lọc theo kho.
 */
@Entity
@Table(
        name = "inventories",
        schema = "nexus_fulfillment",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_inventories_sku_warehouse",
                columnNames = {"sku_id", "warehouse_id"}
        )
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Inventory extends BaseEntity {

    /** SKU được theo dõi tồn — quan hệ cùng module. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sku_id", nullable = false, updatable = false)
    private Sku sku;

    /** Kho chứa SKU này → Warehouse.id (cùng module {@code nexus-fulfillment}). */
    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    /** Tổng số lượng đã nhập kho (bao gồm cả phần đã được giữ chỗ). */
    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    /** Số lượng còn bán được (FR-13, FR-14 tác động vào cột này). */
    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InventoryStatus status;

    /** Optimistic locking — chống đua khi trừ kho (giai đoạn business logic). */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
