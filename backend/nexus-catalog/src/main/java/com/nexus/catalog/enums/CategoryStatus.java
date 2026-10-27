package com.nexus.catalog.enums;

/**
 * Trạng thái danh mục (FR-09, FR-54).
 * "Xoá" danh mục trong module này là chuyển sang {@code INACTIVE} (không hard delete).
 */
public enum CategoryStatus {

    ACTIVE,
    INACTIVE
}
