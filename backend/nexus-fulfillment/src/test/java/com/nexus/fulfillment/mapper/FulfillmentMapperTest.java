package com.nexus.fulfillment.mapper;

import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.entity.Inventory;
import com.nexus.fulfillment.entity.Shipment;
import com.nexus.fulfillment.entity.Sku;
import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.enums.ShipmentStatus;
import com.nexus.fulfillment.enums.WarehouseStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Test mapper thuần JUnit (§14.2). */
class FulfillmentMapperTest {

    private static final UUID SELLER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PRODUCT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID WAREHOUSE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID ORDER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Test
    @DisplayName("InventoryMapper: lấy productId/skuCode từ Sku cùng module")
    void inventoryMapperShouldExposeSkuFields() {
        Sku sku = sku();
        Inventory inventory = Inventory.builder()
                .sku(sku)
                .warehouseId(WAREHOUSE_ID)
                .totalQuantity(10)
                .availableQuantity(4)
                .status(InventoryStatus.LOW_STOCK)
                .build();
        inventory.setId(UUID.randomUUID());
        inventory.setCreatedAt(NOW);
        inventory.setUpdatedAt(NOW);

        InventoryResponse response = InventoryMapper.toResponse(inventory);

        assertThat(response.skuId()).isEqualTo(sku.getId());
        assertThat(response.productId()).isEqualTo(PRODUCT_ID);
        assertThat(response.skuCode()).isEqualTo("SKU-001");
        assertThat(response.skuName()).isEqualTo("Áo thun nam");
        assertThat(response.warehouseId()).isEqualTo(WAREHOUSE_ID);
        assertThat(response.availableQuantity()).isEqualTo(4);
        assertThat(response.status()).isEqualTo(InventoryStatus.LOW_STOCK);
        assertThat(response.createdAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("InventoryMapper: entity không có Sku thì các field SKU là null (không nổ NPE)")
    void inventoryMapperShouldTolerateNullSku() {
        Inventory inventory = Inventory.builder()
                .warehouseId(WAREHOUSE_ID)
                .totalQuantity(0)
                .availableQuantity(0)
                .status(InventoryStatus.OUT_OF_STOCK)
                .build();
        inventory.setId(UUID.randomUUID());

        InventoryResponse response = InventoryMapper.toResponse(inventory);

        assertThat(response.skuId()).isNull();
        assertThat(response.skuCode()).isNull();
        assertThat(response.productId()).isNull();
    }

    @Test
    @DisplayName("SkuMapper: map đủ field, có price")
    void skuMapperShouldMapAllFields() {
        SkuResponse response = SkuMapper.toResponse(sku());

        assertThat(response.sellerId()).isEqualTo(SELLER_ID);
        assertThat(response.productId()).isEqualTo(PRODUCT_ID);
        assertThat(response.skuCode()).isEqualTo("SKU-001");
        assertThat(response.price()).isEqualByComparingTo(new BigDecimal("199000"));
    }

    @Test
    @DisplayName("WarehouseMapper + danh sách")
    void warehouseMapperShouldMapList() {
        Warehouse warehouse = warehouse();

        List<WarehouseResponse> responses = WarehouseMapper.toResponseList(List.of(warehouse));

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().code()).isEqualTo("WH-HN-01");
        assertThat(responses.getFirst().status()).isEqualTo(WarehouseStatus.ACTIVE);
        assertThat(WarehouseMapper.toResponse(warehouse).name()).isEqualTo("Kho Hà Nội");
    }

    @Test
    @DisplayName("ShipmentMapper: map đủ field")
    void shipmentMapperShouldMapAllFields() {
        Shipment shipment = Shipment.builder()
                .orderId(ORDER_ID)
                .sellerId(SELLER_ID)
                .warehouseId(WAREHOUSE_ID)
                .trackingNumber("GHN-123456")
                .status(ShipmentStatus.PENDING)
                .build();
        shipment.setId(UUID.randomUUID());
        shipment.setCreatedAt(NOW);

        ShipmentResponse response = ShipmentMapper.toResponse(shipment);

        assertThat(response.orderId()).isEqualTo(ORDER_ID);
        assertThat(response.sellerId()).isEqualTo(SELLER_ID);
        assertThat(response.trackingNumber()).isEqualTo("GHN-123456");
        assertThat(response.status()).isEqualTo(ShipmentStatus.PENDING);
        assertThat(ShipmentMapper.toResponseList(List.of(shipment))).hasSize(1);
    }

    private Sku sku() {
        Sku sku = Sku.builder()
                .productId(PRODUCT_ID)
                .sellerId(SELLER_ID)
                .skuCode("SKU-001")
                .name("Áo thun nam")
                .price(new BigDecimal("199000"))
                .build();
        sku.setId(UUID.randomUUID());
        sku.setCreatedAt(NOW);
        sku.setUpdatedAt(NOW);
        return sku;
    }

    private Warehouse warehouse() {
        Warehouse warehouse = Warehouse.builder()
                .code("WH-HN-01")
                .name("Kho Hà Nội")
                .address("Số 1 Đại Cồ Việt")
                .status(WarehouseStatus.ACTIVE)
                .build();
        warehouse.setId(WAREHOUSE_ID);
        warehouse.setCreatedAt(NOW);
        return warehouse;
    }
}
