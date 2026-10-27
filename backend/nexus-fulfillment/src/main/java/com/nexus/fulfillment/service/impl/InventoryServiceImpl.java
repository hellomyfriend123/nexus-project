package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.seller.UpdateInventoryRequest;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Sku;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.mapper.InventoryMapper;
import com.nexus.fulfillment.repository.InventoryRepository;
import com.nexus.fulfillment.service.InventoryService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** FR-13, FR-14, FR-55. */
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    /** Ngưỡng cảnh báo sắp hết hàng (FR-14). */
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryResponse> list(UUID sellerId, UUID skuId, UUID productId, UUID warehouseId,
                                               InventoryStatus status, String keyword, Pageable pageable) {
        Specification<Inventory> spec = buildSpecification(sellerId, skuId, productId, warehouseId, status, keyword);
        Page<Inventory> page = inventoryRepository.findAll(spec, pageable);
        return PageResponse.from(page, InventoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse getById(UUID sellerId, UUID inventoryId) {
        Inventory inventory = findOrThrow(inventoryId);
        assertOwnedBy(sellerId, inventory);
        return InventoryMapper.toResponse(inventory);
    }

    @Override
    @Transactional
    public InventoryResponse update(UUID sellerId, UUID inventoryId, UpdateInventoryRequest request) {
        Inventory inventory = findOrThrow(inventoryId);
        // Seller chỉ được sửa tồn kho thuộc SKU của mình (FR-14).
        assertOwnedBy(sellerId, inventory);

        int quantity = request.quantity() == null ? 0 : request.quantity();
        int total = inventory.getTotalQuantity() == null ? 0 : inventory.getTotalQuantity();
        int available = inventory.getAvailableQuantity() == null ? 0 : inventory.getAvailableQuantity();

        int newAvailable = switch (request.operation()) {
            case INCREASE -> available + quantity;
            case DECREASE -> available - quantity;
            case SET_AVAILABLE -> quantity;
        };

        if (newAvailable < 0) {
            throw new BusinessException("Số lượng tồn khả dụng không được âm (hiện có " + available
                    + ", yêu cầu giảm " + quantity + ")");
        }

        // Giữ totalQuantity nhất quán với availableQuantity:
        //  - INCREASE / DECREASE: nhập/xuất kho thật nên tồn tổng đổi theo cùng một lượng.
        //  - SET_AVAILABLE: kiểm kê lại; nếu tồn khả dụng vượt tồn tổng thì nâng tồn tổng lên cho khớp.
        switch (request.operation()) {
            case INCREASE -> total = total + quantity;
            case DECREASE -> total = Math.max(0, total - quantity);
            case SET_AVAILABLE -> total = Math.max(total, newAvailable);
        }

        inventory.setAvailableQuantity(newAvailable);
        inventory.setTotalQuantity(total);
        inventory.setStatus(resolveStatus(newAvailable));

        return InventoryMapper.toResponse(inventoryRepository.save(inventory));
    }

    /** 0 → OUT_OF_STOCK, &lt;= 5 → LOW_STOCK, còn lại → IN_STOCK (FR-14). */
    private InventoryStatus resolveStatus(int availableQuantity) {
        if (availableQuantity <= 0) {
            return InventoryStatus.OUT_OF_STOCK;
        }
        if (availableQuantity <= LOW_STOCK_THRESHOLD) {
            return InventoryStatus.LOW_STOCK;
        }
        return InventoryStatus.IN_STOCK;
    }

    private Inventory findOrThrow(UUID inventoryId) {
        return inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Tồn kho", inventoryId));
    }

    private void assertOwnedBy(UUID sellerId, Inventory inventory) {
        if (sellerId == null) {
            return;
        }
        Sku sku = inventory.getSku();
        if (sku == null || !Objects.equals(sku.getSellerId(), sellerId)) {
            throw new ForbiddenOperationException("Bạn không có quyền truy cập tồn kho của SKU thuộc Seller khác");
        }
    }

    /**
     * Filter động (§8). {@code sellerId != null} → chỉ tồn kho thuộc SKU của Seller đó (FR-13);
     * {@code null} → toàn hệ thống (FR-55).
     */
    private Specification<Inventory> buildSpecification(UUID sellerId, UUID skuId, UUID productId,
                                                       UUID warehouseId, InventoryStatus status, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (sellerId != null || productId != null || StringUtils.hasText(keyword)) {
                Join<Inventory, Sku> skuJoin = root.join("sku", JoinType.INNER);
                if (sellerId != null) {
                    predicates.add(cb.equal(skuJoin.get("sellerId"), sellerId));
                }
                if (productId != null) {
                    predicates.add(cb.equal(skuJoin.get("productId"), productId));
                }
                if (StringUtils.hasText(keyword)) {
                    predicates.add(cb.like(cb.lower(skuJoin.get("skuCode")),
                            "%" + keyword.trim().toLowerCase() + "%"));
                }
            }
            if (skuId != null) {
                predicates.add(cb.equal(root.get("sku").get("id"), skuId));
            }
            if (warehouseId != null) {
                predicates.add(cb.equal(root.get("warehouseId"), warehouseId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
