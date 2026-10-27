package com.nexus.fulfillment.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * SKU (đơn vị bán) — bảng {@code nexus_fulfillment.skus} (§16).
 * <p>
 * {@code productId} là tham chiếu chéo module (nexus-catalog) nên chỉ là {@code UUID} trần —
 * KHÔNG có quan hệ JPA, không FK.
 * <p>
 * {@code sellerId} là cột <b>denormalized</b> (sao chép từ Product) để FR-13 lọc tồn kho theo
 * Seller bằng một câu truy vấn duy nhất, không phải join sang schema {@code nexus_catalog}.
 */
@Entity
@Table(name = "skus", schema = "nexus_fulfillment")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Sku extends BaseEntity {

    /** Tham chiếu chéo module → Product.id (nexus_catalog.products). */
    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;

    /** Tham chiếu chéo module → User.id (Seller sở hữu SKU) — denormalized để lọc theo Seller. */
    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;

    /** Mã SKU, duy nhất toàn hệ thống; dùng cho tìm kiếm {@code keyword} của FR-13. */
    @Column(name = "sku_code", nullable = false, unique = true, length = 100)
    private String skuCode;

    @Column(name = "name", length = 200)
    private String name;

    /** Giá riêng của SKU; để trống thì lấy giá của Product. */
    @Column(name = "price", precision = 19, scale = 2)
    private BigDecimal price;
}
