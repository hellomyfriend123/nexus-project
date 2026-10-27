package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.admin.CreateWarehouseRequest;
import com.nexus.fulfillment.dto.admin.UpdateWarehouseRequest;
import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.WarehouseStatus;
import com.nexus.fulfillment.repository.WarehouseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
 * Quản lý kho của Admin — thuần Mockito (§14).
 */
@ExtendWith(MockitoExtension.class)
class WarehouseServiceImplTest {

    private static final UUID WAREHOUSE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private WarehouseRepository warehouseRepository;

    @InjectMocks
    private WarehouseServiceImpl warehouseService;

    @Test
    @DisplayName("Tạo kho: trạng thái khởi tạo luôn là ACTIVE")
    void createShouldStartActive() {
        when(warehouseRepository.existsByCode("WH-HN-01")).thenReturn(false);
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WarehouseResponse response = warehouseService.create(
                new CreateWarehouseRequest("WH-HN-01", "Kho Hà Nội", "Số 1 Đại Cồ Việt"));

        assertThat(response.code()).isEqualTo("WH-HN-01");
        assertThat(response.status()).isEqualTo(WarehouseStatus.ACTIVE);

        ArgumentCaptor<Warehouse> captor = ArgumentCaptor.forClass(Warehouse.class);
        verify(warehouseRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(WarehouseStatus.ACTIVE);
    }

    @Test
    @DisplayName("Tạo kho trùng mã → DuplicateResourceException")
    void createDuplicateCodeShouldFail() {
        when(warehouseRepository.existsByCode("WH-HN-01")).thenReturn(true);

        assertThatThrownBy(() -> warehouseService.create(
                new CreateWarehouseRequest("WH-HN-01", "Kho Hà Nội", null)))
                .isInstanceOf(DuplicateResourceException.class);

        verify(warehouseRepository, never()).save(any(Warehouse.class));
    }

    @Test
    @DisplayName("Cập nhật kho với status = INACTIVE = xoá mềm (không hard delete)")
    void updateToInactiveIsSoftDelete() {
        Warehouse warehouse = warehouse(WarehouseStatus.ACTIVE);
        when(warehouseRepository.findById(WAREHOUSE_ID)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WarehouseResponse response = warehouseService.update(WAREHOUSE_ID,
                new UpdateWarehouseRequest("Kho Hà Nội (ngừng dùng)", "Số 1 Đại Cồ Việt", WarehouseStatus.INACTIVE));

        assertThat(response.status()).isEqualTo(WarehouseStatus.INACTIVE);

        // Không hard delete: chỉ save bản ghi với status = INACTIVE.
        ArgumentCaptor<Warehouse> captor = ArgumentCaptor.forClass(Warehouse.class);
        verify(warehouseRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(WarehouseStatus.INACTIVE);
    }

    @Test
    @DisplayName("Cập nhật kho không tồn tại → ResourceNotFoundException")
    void updateUnknownWarehouseShouldFail() {
        when(warehouseRepository.findById(WAREHOUSE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> warehouseService.update(WAREHOUSE_ID,
                new UpdateWarehouseRequest("Kho X", null, WarehouseStatus.ACTIVE)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Danh sách kho lọc theo status, trả PageResponse")
    void listWithStatusShouldUseFilteredQuery() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Warehouse> page = new PageImpl<>(List.of(warehouse(WarehouseStatus.ACTIVE)), pageable, 1);
        when(warehouseRepository.findAllByStatus(eq(WarehouseStatus.ACTIVE), eq(pageable))).thenReturn(page);

        PageResponse<WarehouseResponse> response = warehouseService.list(WarehouseStatus.ACTIVE, pageable);

        assertThat(response.content()).hasSize(1);
        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.first()).isTrue();
    }

    private Warehouse warehouse(WarehouseStatus status) {
        Warehouse warehouse = Warehouse.builder()
                .code("WH-HN-01")
                .name("Kho Hà Nội")
                .address("Số 1 Đại Cồ Việt")
                .status(status)
                .build();
        warehouse.setId(WAREHOUSE_ID);
        return warehouse;
    }
}
