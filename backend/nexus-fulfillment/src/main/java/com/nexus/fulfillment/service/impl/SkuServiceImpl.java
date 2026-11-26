package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
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

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/** SKU — phục vụ FR-05 (tạo product kèm SKU + tồn kho ban đầu) và FR-13. */
@Service
@RequiredArgsConstructor
public class SkuServiceImpl implements SkuService {

    /** Ngưỡng cảnh báo sắp hết hàng — dùng chung quy tắc với FR-14. */
    private static final int LOW_STOCK_THRESHOLD = 5;

    /** Tiền tố mã SKU do hệ thống sinh: SKU-001, SKU-002, … */
    private static final String SKU_CODE_PREFIX = "SKU";

    private final SkuRepository skuRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional
    public SkuResponse create(UUID sellerId, CreateSkuRequest request) {
        if (request.costPrice() != null && request.price() != null
                && request.costPrice().compareTo(request.price()) > 0) {
            throw new BusinessException("Không được phép bán lỗ: Giá bán SKU (" + request.price()
                    + ") không được thấp hơn Giá gốc (" + request.costPrice() + ")");
        }

        Sku sku = Sku.builder()
                .productId(request.productId())
                .sellerId(sellerId)
                .skuCode(generateSkuCode())
                .name(request.name())
                .costPrice(request.costPrice())
                .price(request.price())
                .build();
        Sku saved = skuRepository.save(sku);

        // Tạo ngay bản ghi tồn kho ở kho mặc định (kho ACTIVE đầu tiên theo mã kho).
        createInitialInventory(saved, request);

        return SkuMapper.toResponse(saved);
    }

    /**
     * Sinh mã SKU kế tiếp dạng {@code SKU-001}, {@code SKU-002}, …
     * <p>
     * Seller <b>không nhập</b> mã này nữa — hệ thống cấp mã, FE chỉ hiển thị lại
     * {@code SkuResponse.skuCode}. Số kế tiếp lấy từ mã lớn nhất đang có trong DB nên đúng cả sau khi
     * khởi động lại và sau khi có bản ghi bị xoá. Unique index {@code ux_skus_sku_code} là lớp bảo vệ
     * cuối nếu hai request song song cùng ra một số.
     */
    private String generateSkuCode() {
        int maxNumber = skuRepository.findSkuCodesStartingWith(SKU_CODE_PREFIX + "-").stream()
                .mapToInt(code -> SequentialCodeGenerator.numberOf(SKU_CODE_PREFIX, code))
                .max()
                .orElse(0);
        return SequentialCodeGenerator.next(SKU_CODE_PREFIX, maxNumber, skuRepository::existsBySkuCode);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SkuResponse> listBySeller(UUID sellerId, Pageable pageable) {
        Page<Sku> page = skuRepository.findAllBySellerId(sellerId, pageable);
        return PageResponse.from(page, SkuMapper::toResponse);
    }

    @Override
    @Transactional
    public SkuResponse update(UUID sellerId, UUID skuId, String name, BigDecimal costPrice, BigDecimal price) {
        Sku sku = skuRepository.findById(skuId)
                .orElseThrow(() -> new ResourceNotFoundException("SKU", skuId));
        if (!sku.getSellerId().equals(sellerId)) {
            throw new ForbiddenOperationException("Bạn không có quyền chỉnh sửa SKU này");
        }
        if (name != null && !name.isBlank()) {
            sku.setName(name.trim());
        }
        if (costPrice != null && costPrice.compareTo(BigDecimal.ZERO) >= 0) {
            sku.setCostPrice(costPrice);
        }
        if (price != null && price.compareTo(BigDecimal.ZERO) > 0) {
            sku.setPrice(price);
        }
        if (sku.getCostPrice() != null && sku.getPrice() != null
                && sku.getCostPrice().compareTo(sku.getPrice()) > 0) {
            throw new BusinessException("Không được phép bán lỗ: Giá bán SKU (" + sku.getPrice()
                    + ") không được thấp hơn Giá gốc (" + sku.getCostPrice() + ")");
        }
        return SkuMapper.toResponse(skuRepository.save(sku));
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
