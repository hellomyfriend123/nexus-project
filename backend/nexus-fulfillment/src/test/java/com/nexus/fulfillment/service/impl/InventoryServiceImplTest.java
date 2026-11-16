package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.seller.UpdateInventoryRequest;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Sku;
import com.nexus.fulfillment.enums.InventoryOperation;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.repository.InventoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentMatchers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FR-13 / FR-14 — thuần Mockito, không Spring context, không DB (§14).
 */
@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    private static final UUID SELLER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_SELLER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID SKU_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID PRODUCT_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID INVENTORY_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private static final UUID WAREHOUSE_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    // ---------------------------------------------------------------- FR-14

    @Test
    @DisplayName("FR-14: giảm quá số lượng khả dụng → BusinessException, không ghi DB")
    void updateDecreaseMoreThanAvailableShouldThrowBusinessException() {
        Inventory inventory = inventory(20, 5, InventoryStatus.LOW_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));

        UpdateInventoryRequest request = new UpdateInventoryRequest(InventoryOperation.DECREASE, 10);

        assertThatThrownBy(() -> inventoryService.update(SELLER_ID, INVENTORY_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không được âm");

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("FR-14: cập nhật tồn khả dụng về 0 → status = OUT_OF_STOCK")
    void updateToZeroShouldBeOutOfStock() {
        Inventory inventory = inventory(4, 4, InventoryStatus.LOW_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryResponse response = inventoryService.update(SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.SET_AVAILABLE, 0));

        assertThat(response.availableQuantity()).isZero();
        assertThat(response.status()).isEqualTo(InventoryStatus.OUT_OF_STOCK);
        assertThat(response.totalQuantity()).isEqualTo(4);
    }

    @Test
    @DisplayName("FR-14: SET_AVAILABLE trong khoảng 1..5 → status = LOW_STOCK")
    void updateToLowStock() {
        Inventory inventory = inventory(10, 10, InventoryStatus.IN_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryResponse response = inventoryService.update(SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.SET_AVAILABLE, 5));

        assertThat(response.status()).isEqualTo(InventoryStatus.LOW_STOCK);
        assertThat(response.availableQuantity()).isEqualTo(5);
    }

    @Test
    @DisplayName("FR-14: INCREASE cộng vào cả tồn tổng và tồn khả dụng → status = IN_STOCK")
    void updateIncreaseShouldRaiseTotal() {
        Inventory inventory = inventory(3, 3, InventoryStatus.LOW_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryResponse response = inventoryService.update(SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.INCREASE, 7));

        assertThat(response.totalQuantity()).isEqualTo(10);
        assertThat(response.availableQuantity()).isEqualTo(10);
        assertThat(response.status()).isEqualTo(InventoryStatus.IN_STOCK);
    }

    @Test
    @DisplayName("FR-14: DECREASE hợp lệ trừ đều tồn tổng và tồn khả dụng")
    void updateDecreaseShouldLowerTotal() {
        Inventory inventory = inventory(10, 10, InventoryStatus.IN_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryResponse response = inventoryService.update(SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.DECREASE, 4));

        assertThat(response.totalQuantity()).isEqualTo(6);
        assertThat(response.availableQuantity()).isEqualTo(6);
        assertThat(response.status()).isEqualTo(InventoryStatus.IN_STOCK);
    }

    @Test
    @DisplayName("FR-14: Seller khác cập nhật tồn kho → ForbiddenOperationException")
    void updateByOtherSellerShouldBeForbidden() {
        Inventory inventory = inventory(10, 10, InventoryStatus.IN_STOCK, SELLER_ID);
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.of(inventory));

        assertThatThrownBy(() -> inventoryService.update(OTHER_SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.INCREASE, 1)))
                .isInstanceOf(ForbiddenOperationException.class);

        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    @DisplayName("FR-14: không tìm thấy tồn kho → ResourceNotFoundException")
    void updateUnknownInventoryShouldBeNotFound() {
        when(inventoryRepository.findById(INVENTORY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.update(SELLER_ID, INVENTORY_ID,
                new UpdateInventoryRequest(InventoryOperation.INCREASE, 1)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------------------------------------------------------------- FR-13

    @Test
    @DisplayName("FR-13: danh sách tồn kho được map sang InventoryResponse kèm skuCode")
    void listShouldMapFields() {
        Inventory inventory = inventory(12, 12, InventoryStatus.IN_STOCK, SELLER_ID);
        Pageable pageable = PageRequest.of(0, 20);
        Page<Inventory> page = new PageImpl<>(List.of(inventory), pageable, 1);
        when(inventoryRepository.findAll(ArgumentMatchers.<Specification<Inventory>>any(), eq(pageable))).thenReturn(page);

        PageResponse<InventoryResponse> response = inventoryService.list(SELLER_ID, SKU_ID, PRODUCT_ID,
                WAREHOUSE_ID, InventoryStatus.IN_STOCK, "SKU-001", pageable);

        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.content()).hasSize(1);
        InventoryResponse item = response.content().getFirst();
        assertThat(item.skuCode()).isEqualTo("SKU-001");
        assertThat(item.productId()).isEqualTo(PRODUCT_ID);
        assertThat(item.skuId()).isEqualTo(SKU_ID);
        assertThat(item.warehouseId()).isEqualTo(WAREHOUSE_ID);
        assertThat(item.status()).isEqualTo(InventoryStatus.IN_STOCK);
    }

    @Test
    @DisplayName("FR-55: Admin xem toàn hệ thống (sellerId = null) vẫn lọc được theo keyword")
    void listForAdminWithoutSellerShouldFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Inventory> page = new PageImpl<>(List.of(inventory(2, 2, InventoryStatus.LOW_STOCK, SELLER_ID)),
                pageable, 1);
        when(inventoryRepository.findAll(ArgumentMatchers.<Specification<Inventory>>any(), eq(pageable))).thenReturn(page);

        PageResponse<InventoryResponse> response = inventoryService.list(null, null, null, null, null, "sku-001",
                pageable);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().getFirst().skuCode()).isEqualTo("SKU-001");
    }

    // ---------------------------------------------------------------- helpers

    private Inventory inventory(int total, int available, InventoryStatus status, UUID skuOwnerId) {
        Sku sku = Sku.builder()
                .productId(PRODUCT_ID)
                .sellerId(skuOwnerId)
                .skuCode("SKU-001")
                .name("Áo thun nam")
                .build();
        sku.setId(SKU_ID);

        Inventory inventory = Inventory.builder()
                .sku(sku)
                .warehouseId(WAREHOUSE_ID)
                .totalQuantity(total)
                .availableQuantity(available)
                .status(status)
                .build();
        inventory.setId(INVENTORY_ID);
        return inventory;
    }
}
