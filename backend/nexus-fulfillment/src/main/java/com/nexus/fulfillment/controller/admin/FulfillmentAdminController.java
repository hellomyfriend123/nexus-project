package com.nexus.fulfillment.controller.admin;

import com.nexus.common.api.PageResponse;
import com.nexus.fulfillment.dto.admin.CreateWarehouseRequest;
import com.nexus.fulfillment.dto.admin.UpdateWarehouseRequest;
import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.enums.WarehouseStatus;
import com.nexus.fulfillment.service.InventoryService;
import com.nexus.fulfillment.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Admin — giám sát tồn kho toàn hệ thống (FR-55) và quản lý kho hàng.
 * Kho không bị xoá cứng: dùng {@code PUT} với {@code status = INACTIVE}.
 */
@RestController
@RequestMapping("/api/v1/admin/fulfillment")
@Tag(name = "Fulfillment — Admin", description = "FR-55 và quản lý kho hàng")
@RequiredArgsConstructor
public class FulfillmentAdminController {

    private final InventoryService inventoryService;
    private final WarehouseService warehouseService;

    // ---------------------------------------------------------------- Tồn kho (FR-55)

    @GetMapping("/inventories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-55 — Admin giám sát tồn kho toàn hệ thống",
            description = "Không giới hạn theo Seller; lọc theo skuId, productId, warehouseId, status, keyword (sku_code).")
    @ApiResponse(responseCode = "200", description = "Danh sách tồn kho có phân trang")
    public ResponseEntity<PageResponse<InventoryResponse>> listInventories(
            @RequestParam(required = false) UUID skuId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) InventoryStatus status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        // sellerId = null → toàn hệ thống (FR-55).
        return ResponseEntity.ok(inventoryService.list(null, skuId, productId, warehouseId, status, keyword, pageable));
    }

    // ---------------------------------------------------------------- Kho hàng

    @GetMapping("/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-55 — Admin xem danh sách kho hàng")
    @ApiResponse(responseCode = "200", description = "Danh sách kho có phân trang")
    public ResponseEntity<PageResponse<WarehouseResponse>> listWarehouses(
            @RequestParam(required = false) WarehouseStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(warehouseService.list(status, pageable));
    }

    @GetMapping("/warehouses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-55 — Admin xem chi tiết kho hàng")
    @ApiResponse(responseCode = "200", description = "Chi tiết kho")
    public ResponseEntity<WarehouseResponse> getWarehouse(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.getById(id));
    }

    @PostMapping("/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-55 — Admin tạo kho hàng mới",
            description = "Trạng thái khởi tạo là ACTIVE; mã kho trùng sẽ bị từ chối (409).")
    @ApiResponse(responseCode = "201", description = "Tạo kho thành công")
    public ResponseEntity<WarehouseResponse> createWarehouse(@Valid @RequestBody CreateWarehouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.create(request));
    }

    @PutMapping("/warehouses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-55 — Admin cập nhật / ngừng hoạt động kho",
            description = "Gửi status = INACTIVE để \"xoá\" kho (không hard delete). Mã kho không đổi được.")
    @ApiResponse(responseCode = "200", description = "Cập nhật kho thành công")
    public ResponseEntity<WarehouseResponse> updateWarehouse(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateWarehouseRequest request) {
        return ResponseEntity.ok(warehouseService.update(id, request));
    }
}
