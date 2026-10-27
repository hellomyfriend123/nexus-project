package com.nexus.fulfillment.service.impl;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.dto.seller.CreateShipmentRequest;
import com.nexus.fulfillment.dto.seller.UpdateShipmentStatusRequest;
import com.nexus.fulfillment.entity.Shipment;
import com.nexus.fulfillment.enums.ShipmentStatus;
import com.nexus.fulfillment.repository.ShipmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FR-38 / FR-39 / FR-40 — thuần Mockito, không Spring context, không DB (§14).
 */
@ExtendWith(MockitoExtension.class)
class ShipmentServiceImplTest {

    private static final UUID SELLER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_SELLER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ORDER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID SHIPMENT_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID WAREHOUSE_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

    @Mock
    private ShipmentRepository shipmentRepository;

    @InjectMocks
    private ShipmentServiceImpl shipmentService;

    // ---------------------------------------------------------------- FR-39

    @Test
    @DisplayName("FR-39: PENDING → DELIVERED (nhảy cóc) → BusinessException, không lưu")
    void pendingToDeliveredShouldBeRejected() {
        Shipment shipment = shipment(ShipmentStatus.PENDING);
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.of(shipment));

        assertThatThrownBy(() -> shipmentService.updateStatus(SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.DELIVERED)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDING");

        assertThat(shipment.getStatus()).isEqualTo(ShipmentStatus.PENDING);
        verify(shipmentRepository, never()).save(any(Shipment.class));
    }

    @Test
    @DisplayName("FR-39: Seller khác cập nhật vận đơn → ForbiddenOperationException")
    void updateByOtherSellerShouldBeForbidden() {
        Shipment shipment = shipment(ShipmentStatus.PENDING);
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.of(shipment));

        assertThatThrownBy(() -> shipmentService.updateStatus(OTHER_SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.SHIPPED)))
                .isInstanceOf(ForbiddenOperationException.class);

        verify(shipmentRepository, never()).save(any(Shipment.class));
    }

    @Test
    @DisplayName("FR-39: PENDING → SHIPPED hợp lệ")
    void pendingToShippedShouldSucceed() {
        Shipment shipment = shipment(ShipmentStatus.PENDING);
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentResponse response = shipmentService.updateStatus(SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.SHIPPED));

        assertThat(response.status()).isEqualTo(ShipmentStatus.SHIPPED);
    }

    @Test
    @DisplayName("FR-39: SHIPPED → DELIVERED hợp lệ (đúng bước kế tiếp)")
    void shippedToDeliveredShouldSucceed() {
        Shipment shipment = shipment(ShipmentStatus.SHIPPED);
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentResponse response = shipmentService.updateStatus(SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.DELIVERED));

        assertThat(response.status()).isEqualTo(ShipmentStatus.DELIVERED);
    }

    @Test
    @DisplayName("FR-39: DELIVERED → SHIPPED (lùi trạng thái) → BusinessException")
    void deliveredToShippedShouldBeRejected() {
        Shipment shipment = shipment(ShipmentStatus.DELIVERED);
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.of(shipment));

        assertThatThrownBy(() -> shipmentService.updateStatus(SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.SHIPPED)))
                .isInstanceOf(BusinessException.class);

        verify(shipmentRepository, never()).save(any(Shipment.class));
    }

    @Test
    @DisplayName("FR-39: không tìm thấy vận đơn → ResourceNotFoundException")
    void updateUnknownShipmentShouldBeNotFound() {
        when(shipmentRepository.findById(SHIPMENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shipmentService.updateStatus(SELLER_ID, SHIPMENT_ID,
                new UpdateShipmentStatusRequest(ShipmentStatus.SHIPPED)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------------------------------------------------------------- FR-38

    @Test
    @DisplayName("FR-38: tạo vận đơn luôn ở trạng thái PENDING và gắn sellerId từ token")
    void createShouldStartAsPending() {
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentResponse response = shipmentService.create(SELLER_ID,
                new CreateShipmentRequest(ORDER_ID, WAREHOUSE_ID, "GHN-123456"));

        assertThat(response.status()).isEqualTo(ShipmentStatus.PENDING);
        assertThat(response.sellerId()).isEqualTo(SELLER_ID);
        assertThat(response.orderId()).isEqualTo(ORDER_ID);
        assertThat(response.warehouseId()).isEqualTo(WAREHOUSE_ID);
        assertThat(response.trackingNumber()).isEqualTo("GHN-123456");

        ArgumentCaptor<Shipment> captor = ArgumentCaptor.forClass(Shipment.class);
        verify(shipmentRepository).save(captor.capture());
        assertThat(captor.getValue().getSellerId()).isEqualTo(SELLER_ID);
    }

    @Test
    @DisplayName("FR-38: thiếu orderId → BusinessException")
    void createWithoutOrderIdShouldFail() {
        assertThatThrownBy(() -> shipmentService.create(SELLER_ID,
                new CreateShipmentRequest(null, null, "GHN-1")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("orderId");

        verify(shipmentRepository, never()).save(any(Shipment.class));
    }

    // ---------------------------------------------------------------- FR-40

    @Test
    @DisplayName("FR-40: tra vận đơn theo orderId")
    void listByOrderIdShouldReturnShipments() {
        when(shipmentRepository.findAllByOrderIdOrderByCreatedAtDesc(ORDER_ID))
                .thenReturn(List.of(shipment(ShipmentStatus.SHIPPED)));

        List<ShipmentResponse> responses = shipmentService.listByOrderId(ORDER_ID);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().status()).isEqualTo(ShipmentStatus.SHIPPED);
        assertThat(responses.getFirst().orderId()).isEqualTo(ORDER_ID);
    }

    @Test
    @DisplayName("FR-40: thiếu orderId → BusinessException")
    void listByNullOrderIdShouldFail() {
        assertThatThrownBy(() -> shipmentService.listByOrderId(null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("orderId");
    }

    // ---------------------------------------------------------------- helpers

    private Shipment shipment(ShipmentStatus status) {
        Shipment shipment = Shipment.builder()
                .orderId(ORDER_ID)
                .warehouseId(WAREHOUSE_ID)
                .sellerId(SELLER_ID)
                .trackingNumber("GHN-123456")
                .status(status)
                .build();
        shipment.setId(SHIPMENT_ID);
        return shipment;
    }
}
