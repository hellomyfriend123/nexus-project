package com.nexus.catalog.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Ảnh của sản phẩm (FR-05, FR-07) — bảng {@code nexus_catalog.product_images}.
 * Một sản phẩm có tối đa một ảnh chính ({@code is_primary = true}).
 */
@Entity
@Table(name = "product_images", schema = "nexus_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage extends BaseEntity {

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /**
     * Ảnh chính — tương ứng cột {@code is_primary} (§16).
     * Tên field là {@code primary} (không phải {@code isPrimary}) để tránh nhầm lẫn getter {@code isXxx()}
     * của Lombok/Jackson.
     */
    @Column(name = "is_primary", nullable = false)
    private Boolean primary;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
