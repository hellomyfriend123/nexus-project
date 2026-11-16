package com.nexus.fulfillment.mapper;

import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Sku;

import java.util.List;

/** Mapper viết tay cho {@link Inventory} (§9 — không dùng MapStruct/reflection). */
public final class InventoryMapper {

    private InventoryMapper() {
    }

    /**
     * Chỉ gọi khi {@code sku} đã được nạp (trong service là {@code @Transactional} nên proxy LAZY
     * vẫn truy cập được). Nếu entity không có SKU thì trả các field SKU là {@code null}.
     */
    public static InventoryResponse toResponse(Inventory entity) {
        Sku sku = entity.getSku();
        return new InventoryResponse(
                entity.getId(),
                sku == null ? null : sku.getId(),
                sku == null ? null : sku.getProductId(),
                sku == null ? null : sku.getSkuCode(),
                sku == null ? null : sku.getName(),
                entity.getWarehouseId(),
                entity.getTotalQuantity(),
                entity.getAvailableQuantity(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<InventoryResponse> toResponseList(List<Inventory> entities) {
        return entities.stream().map(InventoryMapper::toResponse).toList();
    }
}
