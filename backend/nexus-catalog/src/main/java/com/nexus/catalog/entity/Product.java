package com.nexus.catalog.entity;

import com.nexus.catalog.enums.ProductStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Sản phẩm (FR-05, FR-06, FR-07, FR-08, FR-10, FR-11, FR-12, FR-53) — bảng {@code nexus_catalog.products}.
 * {@code sellerId} là tham chiếu chéo module tới {@code nexus_user.users} nhưng CHỈ là UUID trần
 * (không có quan hệ JPA, không FK — §2, §4).
 */
@Entity
@Table(name = "products", schema = "nexus_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product extends BaseEntity {

    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 5000)
    private String description;

    @Column(name = "base_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal basePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status;

    /**
     * Soft delete (FR-08). Khác {@code null} nghĩa là sản phẩm đã bị xoá.
     * MỌI truy vấn đọc sản phẩm phải lọc {@code deleted_at IS NULL}.
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
