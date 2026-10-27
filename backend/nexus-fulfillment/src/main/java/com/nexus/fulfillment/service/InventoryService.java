package com.nexus.fulfillment.service;

import com.nexus.common.api.PageResponse;
import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.seller.UpdateInventoryRequest;
import com.nexus.fulfillment.enums.InventoryStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** FR-13, FR-14, FR-55 — xem và cập nhật tồn kho. */
public interface InventoryService {

    /**
     * FR-13 / FR-55 — danh sách tồn kho có lọc động.
     *
     * @param sellerId {@code null} = toàn hệ thống (Admin, FR-55); có giá trị = chỉ SKU của Seller đó (FR-13)
     */
    PageResponse<InventoryResponse> list(UUID sellerId, UUID skuId, UUID productId, UUID warehouseId,
                                        InventoryStatus status, String keyword, Pageable pageable);

    /** Lấy một dòng tồn kho; Seller chỉ được xem tồn kho thuộc SKU của mình. */
    InventoryResponse getById(UUID sellerId, UUID inventoryId);

    /**
     * FR-14 — tăng/giảm/đặt lại tồn khả dụng, sau đó tự tính lại {@code status} và {@code totalQuantity}.
     * Không cho kết quả âm → {@code BusinessException}.
     */
    InventoryResponse update(UUID sellerId, UUID inventoryId, UpdateInventoryRequest request);
}
