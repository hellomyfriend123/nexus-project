package com.nexus.catalog.entity;

import com.nexus.catalog.enums.CategoryStatus;
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

import java.util.UUID;

/**
 * Danh mục sản phẩm (FR-09, FR-54) — bảng {@code nexus_catalog.categories}.
 * Cây danh mục được biểu diễn bằng {@code parentId} (UUID tự tham chiếu, KHÔNG dùng quan hệ JPA).
 */
@Entity
@Table(name = "categories", schema = "nexus_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    /** Danh mục cha; {@code null} nghĩa là danh mục gốc. */
    @Column(name = "parent_id")
    private UUID parentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CategoryStatus status;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
