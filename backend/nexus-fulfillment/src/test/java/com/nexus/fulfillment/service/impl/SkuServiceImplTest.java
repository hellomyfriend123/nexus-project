package com.nexus.fulfillment.service.impl;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.dto.seller.CreateSkuRequest;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Sku;
import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.enums.WarehouseStatus;
import com.nexus.fulfillment.repository.InventoryRepository;
import com.nexus.fulfillment.repository.SkuRepository;
import com.nexus.fulfillment.repository.WarehouseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SKU kèm tồn kho ban đầu (nối vào FR-05) — thuần Mockito (§14).
 */
@ExtendWith(MockitoExtension.class)
class SkuServiceImplTest {

    private static final UUID SELLER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PRODUCT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID WAREHOUSE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private SkuRepository skuRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @InjectMocks
    private SkuServiceImpl skuService;

    @Test
    @DisplayName("Tạo SKU thành công: tạo luôn Inventory ở kho ACTIVE mặc định với tồn ban đầu")
    void createShouldAlsoCreateInitialInventory() {
        when(skuRepository.existsBySkuCode("SKU-001")).thenReturn(false);
        when(skuRepository.save(any(Sku.class))).thenAnswer(invocation -> {
            Sku sku = invocation.getArgument(0);
            sku.setId(UUID.randomUUID());
            return sku;
        });
        when(warehouseRepository.findFirstByStatusOrderByCodeAsc(WarehouseStatus.ACTIVE))
                .thenReturn(Optional.of(warehouse()));
        when(inventoryRepository.findBySkuIdAndWarehouseId(any(UUID.class), any(UUID.class)))
                .thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SkuResponse response = skuService.create(SELLER_ID,
                new CreateSkuRequest(PRODUCT_ID, "SKU-001", "Áo thun nam", new BigDecimal("199000"), 8, 8));

        assertThat(response.sellerId()).isEqualTo(SELLER_ID);
        assertThat(response.productId()).isEqualTo(PRODUCT_ID);

        ArgumentCaptor<Inventory> captor = ArgumentCaptor.forClass(Inventory.class);
        verify(inventoryRepository).save(captor.capture());
        Inventory inventory = captor.getValue();
        assertThat(inventory.getWarehouseId()).isEqualTo(WAREHOUSE_ID);
        assertThat(inventory.getTotalQuantity()).isEqualTo(8);
        assertThat(inventory.getAvailableQuantity()).isEqualTo(8);
        assertThat(inventory.getStatus()).isEqualTo(InventoryStatus.IN_STOCK);
    }

    @Test
    @DisplayName("Tạo SKU với tồn ban đầu để trống → Inventory 0 và OUT_OF_STOCK")
    void createWithoutInitialQuantityShouldCreateEmptyInventory() {
        when(skuRepository.existsBySkuCode("SKU-002")).thenReturn(false);
        when(skuRepository.save(any(Sku.class))).thenAnswer(invocation -> {
            Sku sku = invocation.getArgument(0);
            sku.setId(UUID.randomUUID());
            return sku;
        });
        when(warehouseRepository.findFirstByStatusOrderByCodeAsc(WarehouseStatus.ACTIVE))
                .thenReturn(Optional.of(warehouse()));
        when(inventoryRepository.findBySkuIdAndWarehouseId(any(UUID.class), any(UUID.class)))
                .thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        skuService.create(SELLER_ID, new CreateSkuRequest(PRODUCT_ID, "SKU-002", "Áo thun nữ", null, null, null));

        ArgumentCaptor<Inventory> captor = ArgumentCaptor.forClass(Inventory.class);
        verify(inventoryRepository).save(captor.capture());
        assertThat(captor.getValue().getTotalQuantity()).isZero();
        assertThat(captor.getValue().getAvailableQuantity()).isZero();
        assertThat(captor.getValue().getStatus()).isEqualTo(InventoryStatus.OUT_OF_STOCK);
    }

    @Test
    @DisplayName("Tồn khả dụng ban đầu lớn hơn tồn tổng → BusinessException")
    void createWithInconsistentInitialQuantityShouldFail() {
        when(skuRepository.existsBySkuCode("SKU-003")).thenReturn(false);
        when(skuRepository.save(any(Sku.class))).thenAnswer(invocation -> {
            Sku sku = invocation.getArgument(0);
            sku.setId(UUID.randomUUID());
            return sku;
        });
        when(warehouseRepository.findFirstByStatusOrderByCodeAsc(WarehouseStatus.ACTIVE))
                .thenReturn(Optional.of(warehouse()));

        CreateSkuRequest request = new CreateSkuRequest(PRODUCT_ID, "SKU-003", "Áo thun", null, 2, 5);

        assertThatThrownBy(() -> skuService.create(SELLER_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tồn khả dụng ban đầu");
    }

    @Test
    @DisplayName("skuCode trùng → DuplicateResourceException, không lưu SKU")
    void createDuplicateSkuCodeShouldFail() {
        when(skuRepository.existsBySkuCode("SKU-001")).thenReturn(true);

        assertThatThrownBy(() -> skuService.create(SELLER_ID,
                new CreateSkuRequest(PRODUCT_ID, "SKU-001", "Áo thun nam", null, 1, 1)))
                .isInstanceOf(DuplicateResourceException.class);

        verify(skuRepository, never()).save(any(Sku.class));
    }

    @Test
    @DisplayName("Chưa có kho ACTIVE → vẫn tạo được SKU, bỏ qua tồn kho ban đầu")
    void createWithoutActiveWarehouseShouldStillCreateSku() {
        when(skuRepository.existsBySkuCode("SKU-004")).thenReturn(false);
        when(skuRepository.save(any(Sku.class))).thenAnswer(invocation -> {
            Sku sku = invocation.getArgument(0);
            sku.setId(UUID.randomUUID());
            return sku;
        });
        when(warehouseRepository.findFirstByStatusOrderByCodeAsc(WarehouseStatus.ACTIVE))
                .thenReturn(Optional.empty());

        SkuResponse response = skuService.create(SELLER_ID,
                new CreateSkuRequest(PRODUCT_ID, "SKU-004", "Áo thun", null, 3, 3));

        assertThat(response.skuCode()).isEqualTo("SKU-004");
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    private Warehouse warehouse() {
        Warehouse warehouse = Warehouse.builder()
                .code("WH-HN-01")
                .name("Kho Hà Nội")
                .address("Số 1 Đại Cồ Việt, Hà Nội")
                .status(WarehouseStatus.ACTIVE)
                .build();
        warehouse.setId(WAREHOUSE_ID);
        return warehouse;
    }
}
