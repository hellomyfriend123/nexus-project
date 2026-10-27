package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.admin.CreateWarehouseRequest;
import com.nexus.fulfillment.dto.admin.UpdateWarehouseRequest;
import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.WarehouseStatus;
import com.nexus.fulfillment.mapper.WarehouseMapper;
import com.nexus.fulfillment.repository.WarehouseRepository;
import com.nexus.fulfillment.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Kho hàng — Admin quản lý (nhóm 5.5 và 5.10 §10). */
@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WarehouseResponse> list(WarehouseStatus status, Pageable pageable) {
        Page<Warehouse> page = status == null
                ? warehouseRepository.findAll(pageable)
                : warehouseRepository.findAllByStatus(status, pageable);
        return PageResponse.from(page, WarehouseMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getById(UUID warehouseId) {
        return WarehouseMapper.toResponse(findOrThrow(warehouseId));
    }

    @Override
    @Transactional
    public WarehouseResponse create(CreateWarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException("Kho", "code", request.code());
        }

        Warehouse warehouse = Warehouse.builder()
                .code(request.code())
                .name(request.name())
                .address(request.address())
                .status(WarehouseStatus.ACTIVE)
                .build();

        return WarehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public WarehouseResponse update(UUID warehouseId, UpdateWarehouseRequest request) {
        Warehouse warehouse = findOrThrow(warehouseId);
        // Mã kho là duy nhất và đã dùng trong tồn kho/vận đơn → không cho đổi sau khi tạo.
        warehouse.setName(request.name());
        warehouse.setAddress(request.address());
        // "Xoá" kho = INACTIVE (không hard delete).
        warehouse.setStatus(request.status());

        return WarehouseMapper.toResponse(warehouseRepository.save(warehouse));
    }

    private Warehouse findOrThrow(UUID warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Kho", warehouseId));
    }
}
