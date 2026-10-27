package com.nexus.fulfillment.entity;

import com.nexus.common.entity.BaseEntity;
import com.nexus.fulfillment.enums.WarehouseStatus;
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

/**
 * Kho hàng — bảng {@code nexus_fulfillment.warehouses} (§16).
 * Quản lý bởi Administrator; không xoá cứng, "xoá" = {@link WarehouseStatus#INACTIVE}.
 */
@Entity
@Table(name = "warehouses", schema = "nexus_fulfillment")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse extends BaseEntity {

    /** Mã kho, duy nhất toàn hệ thống (ví dụ {@code WH-HN-01}). */
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "address", length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WarehouseStatus status;
}
