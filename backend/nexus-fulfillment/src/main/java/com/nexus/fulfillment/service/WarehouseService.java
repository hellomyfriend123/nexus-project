package com.nexus.fulfillment.service;

import com.nexus.common.api.PageResponse;
import com.nexus.fulfillment.dto.admin.CreateWarehouseRequest;
import com.nexus.fulfillment.dto.admin.UpdateWarehouseRequest;
import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.enums.WarehouseStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Kho hàng — Admin quản lý (nhóm 5.5/5.10 §10). */
public interface WarehouseService {

    PageResponse<WarehouseResponse> list(WarehouseStatus status, Pageable pageable);

    WarehouseResponse getById(UUID warehouseId);

    /** Tạo kho mới, trạng thái khởi tạo {@code ACTIVE}. Mã kho trùng → {@code DuplicateResourceException}. */
    WarehouseResponse create(CreateWarehouseRequest request);

    /**
     * Cập nhật kho. "Xoá" kho = gửi {@code status = INACTIVE} (không hard delete).
     * Mã kho không cho đổi sau khi tạo.
     */
    WarehouseResponse update(UUID warehouseId, UpdateWarehouseRequest request);
}
