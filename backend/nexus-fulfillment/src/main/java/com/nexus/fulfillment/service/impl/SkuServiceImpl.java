package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.dto.seller.CreateSkuRequest;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Sku;
import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.enums.WarehouseStatus;
import com.nexus.fulfillment.mapper.SkuMapper;
import com.nexus.fulfillment.repository.InventoryRepository;
import com.nexus.fulfillment.repository.SkuRepository;
import com.nexus.fulfillment.repository.WarehouseRepository;
import com.nexus.fulfillment.service.SkuService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/** SKU — phục vụ FR-05 (tạo product kèm SKU + tồn kho ban đầu) và FR-13. */
@Service
@RequiredArgsConstructor
public class SkuServiceImpl implements SkuService {

    /** Ngưỡng cảnh báo sắp hết hàng — dùng chung quy tắc với FR-14. */
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final SkuRepository skuRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional
    public SkuResponse create(UUID sellerId, CreateSkuRequest request) {
        if (skuRepository.existsBySkuCode(request.skuCode())) {
            throw new DuplicateResourceException("SKU", "skuCode", request.skuCode());
        }

        Sku sku = Sku.builder()
                .productId(request.productId())
                .sellerId(sellerId)
                .skuCode(request.skuCode())
                .name(request.name())
                .price(request.price())
                .build();
        Sku saved = skuRepository.save(sku);

        // Tạo ngay bản ghi tồn kho ở kho mặc định (kho ACTIVE đầu tiên theo mã kho).
        createInitialInventory(saved, request);

        return SkuMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SkuResponse> listBySeller(UUID sellerId, Pageable pageable) {
        Page<Sku> page = skuRepository.findAllBySellerId(sellerId, pageable);
        return PageResponse.from(page, SkuMapper::toResponse);
    }

    /**
     * Tồn kho ban đầu. Nếu kho mặc định chưa tồn tại (chưa seed kho nào) thì chỉ ghi log nghiệp vụ
     * và bỏ qua — SKU vẫn được tạo, Admin bổ sung kho rồi thêm tồn qua FR-14.
     * Nếu đã có bản ghi tồn cho cặp (sku, kho) thì cộng dồn thay vì tạo trùng (unique sku_id + warehouse_id).
     */
    private void createInitialInventory(Sku sku, CreateSkuRequest request) {
        Optional<Warehouse> defaultWarehouse = warehouseRepository.findFirstByStatusOrderByCodeAsc(WarehouseStatus.ACTIVE);
        if (defaultWarehouse.isEmpty()) {
            return;
        }
        UUID warehouseId = defaultWarehouse.get().getId();

        int totalQuantity = request.initialTotalQuantity() == null ? 0 : request.initialTotalQuantity();
        int availableQuantity = request.initialAvailableQuantity() == null ? 0 : request.initialAvailableQuantity();
        if (availableQuantity > totalQuantity) {
            throw new BusinessException("Tồn khả dụng ban đầu (" + availableQuantity
                    + ") không được lớn hơn tồn tổng (" + totalQuantity + ")");
        }

        Optional<Inventory> existing = inventoryRepository.findBySkuIdAndWarehouseId(sku.getId(), warehouseId);
        Inventory inventory = existing.orElseGet(() -> Inventory.builder()
                .sku(sku)
                .warehouseId(warehouseId)
                .totalQuantity(0)
                .availableQuantity(0)
                .build());

        int newTotal = nvl(inventory.getTotalQuantity()) + totalQuantity;
        int newAvailable = nvl(inventory.getAvailableQuantity()) + availableQuantity;

        inventory.setTotalQuantity(newTotal);
        inventory.setAvailableQuantity(newAvailable);
        inventory.setStatus(resolveStatus(newAvailable));
        inventoryRepository.save(inventory);
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }

    private InventoryStatus resolveStatus(int availableQuantity) {
        if (availableQuantity <= 0) {
            return InventoryStatus.OUT_OF_STOCK;
        }
        if (availableQuantity <= LOW_STOCK_THRESHOLD) {
            return InventoryStatus.LOW_STOCK;
        }
        return InventoryStatus.IN_STOCK;
    }
}
