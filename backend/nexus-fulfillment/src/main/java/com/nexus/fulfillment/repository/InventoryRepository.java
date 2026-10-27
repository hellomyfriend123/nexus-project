package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID>, JpaSpecificationExecutor<Inventory> {

    /** Phục vụ ràng buộc duy nhất {@code (sku_id, warehouse_id)} và việc tạo/trừ tồn kho. */
    Optional<Inventory> findBySkuIdAndWarehouseId(UUID skuId, UUID warehouseId);

    boolean existsBySkuIdAndWarehouseId(UUID skuId, UUID warehouseId);

    /**
     * Tồn kho của Seller (đi qua quan hệ {@code Sku} cùng module — KHÔNG join schema khác).
     * Dùng cho phân trang ở FR-13 khi không cần Specification.
     */
    Page<Inventory> findAllBySku_SellerId(UUID sellerId, Pageable pageable);
}
