package com.nexus.fulfillment.controller.seller;

import com.nexus.common.api.PageResponse;
import com.nexus.common.security.SecurityUtils;
import com.nexus.fulfillment.dto.common.InventoryResponse;
import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.dto.seller.CreateShipmentRequest;
import com.nexus.fulfillment.dto.seller.CreateSkuRequest;
import com.nexus.fulfillment.dto.seller.UpdateInventoryRequest;
import com.nexus.fulfillment.dto.seller.UpdateShipmentStatusRequest;
import com.nexus.fulfillment.enums.InventoryStatus;
import com.nexus.fulfillment.service.InventoryService;
import com.nexus.fulfillment.service.ShipmentService;
import com.nexus.fulfillment.service.SkuService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Seller — SKU, tồn kho, vận đơn.
 * Actor của mọi endpoint ở đây là SELLER; {@code sellerId} luôn lấy từ token (không nhận từ request).
 */
@RestController
@RequestMapping("/api/v1/seller/fulfillment")
@Tag(name = "Fulfillment — Seller", description = "FR-13, FR-14, FR-38, FR-39 và SKU nội bộ cho FR-05")
@RequiredArgsConstructor
public class FulfillmentSellerController {

    private final SkuService skuService;
    private final InventoryService inventoryService;
    private final ShipmentService shipmentService;

    // ---------------------------------------------------------------- SKU (phục vụ FR-05)

    @PostMapping("/skus")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-05 — Seller tạo SKU kèm tồn kho ban đầu ở kho mặc định",
            description = "Tạo SKU của Product đã có và đồng thời tạo bản ghi tồn kho ở kho ACTIVE đầu tiên. "
                    + "Ghi chú: luồng tạo Product kèm SKU sẽ nối vào đây ở giai đoạn business logic.")
    @ApiResponse(responseCode = "201", description = "Tạo SKU thành công")
    public ResponseEntity<SkuResponse> createSku(@Valid @RequestBody CreateSkuRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(skuService.create(sellerId, request));
    }

    @GetMapping("/skus")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-05 — Seller xem danh sách SKU của mình")
    @ApiResponse(responseCode = "200", description = "Danh sách SKU có phân trang")
    public ResponseEntity<PageResponse<SkuResponse>> listSkus(Pageable pageable) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(skuService.listBySeller(sellerId, pageable));
    }

    // ---------------------------------------------------------------- Tồn kho (FR-13, FR-14)

    @GetMapping("/inventories")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-13 — Seller xem tồn kho theo SKU / Product / trạng thái / mã SKU",
            description = "Chỉ trả về tồn kho thuộc SKU của Seller đang đăng nhập.")
    @ApiResponse(responseCode = "200", description = "Danh sách tồn kho có phân trang")
    public ResponseEntity<PageResponse<InventoryResponse>> listInventories(
            @RequestParam(required = false) UUID skuId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) InventoryStatus status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(inventoryService.list(sellerId, skuId, productId, warehouseId, status, keyword, pageable));
    }

    @GetMapping("/inventories/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-13 — Seller xem chi tiết một dòng tồn kho")
    @ApiResponse(responseCode = "200", description = "Chi tiết tồn kho")
    public ResponseEntity<InventoryResponse> getInventory(@PathVariable UUID id) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(inventoryService.getById(sellerId, id));
    }

    @PatchMapping("/inventories/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-14 — Seller tăng/giảm/đặt lại tồn khả dụng",
            description = "operation = INCREASE | DECREASE | SET_AVAILABLE. Kết quả âm bị từ chối; "
                    + "status được tính lại: 0 → OUT_OF_STOCK, ≤ 5 → LOW_STOCK, còn lại → IN_STOCK.")
    @ApiResponse(responseCode = "200", description = "Cập nhật tồn kho thành công")
    public ResponseEntity<InventoryResponse> updateInventory(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateInventoryRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(inventoryService.update(sellerId, id, request));
    }

    // ---------------------------------------------------------------- Vận đơn (FR-38, FR-39)

    @PostMapping("/shipments")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-38 — Seller tạo vận đơn cho đơn hàng",
            description = "Trạng thái khởi tạo là PENDING. Ghi chú: điều kiện \"Order đã thanh toán thành công\" "
                    + "sẽ được kiểm tra khi nối với module commerce ở giai đoạn business logic.")
    @ApiResponse(responseCode = "201", description = "Tạo vận đơn thành công")
    public ResponseEntity<ShipmentResponse> createShipment(@Valid @RequestBody CreateShipmentRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(shipmentService.create(sellerId, request));
    }

    @PatchMapping("/shipments/{id}/status")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-39 — Seller cập nhật trạng thái vận đơn",
            description = "Chỉ chấp nhận PENDING → SHIPPED → DELIVERED; nhảy cóc hoặc lùi trạng thái bị từ chối.")
    @ApiResponse(responseCode = "200", description = "Cập nhật trạng thái thành công")
    public ResponseEntity<ShipmentResponse> updateShipmentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateShipmentStatusRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(shipmentService.updateStatus(sellerId, id, request));
    }
}
