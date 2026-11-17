package com.nexus.fulfillment.controller.buyer;

import com.nexus.common.security.SecurityUtils;
import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Buyer — theo dõi vận đơn của một đơn hàng (FR-40).
 * Buyer chỉ tra cứu vận đơn của Order thuộc tài khoản đang đăng nhập.
 */
@RestController
@RequestMapping("/api/v1/buyer/fulfillment")
@Tag(name = "Fulfillment — Buyer", description = "FR-40")
@RequiredArgsConstructor
public class FulfillmentBuyerController {

    private final ShipmentService shipmentService;

    @GetMapping("/shipments")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "FR-40 — Buyer theo dõi vận đơn theo mã đơn hàng",
            description = "Trả về danh sách vận đơn (mới nhất trước) của đơn hàng cần tra cứu.")
    @ApiResponse(responseCode = "200", description = "Danh sách vận đơn của đơn hàng")
    @ApiResponse(responseCode = "403", description = "Đơn hàng thuộc Buyer khác")
    @ApiResponse(responseCode = "404", description = "Không tìm thấy đơn hàng")
    public ResponseEntity<List<ShipmentResponse>> trackShipments(@RequestParam UUID orderId) {
        return ResponseEntity.ok(shipmentService.listByOrderId(SecurityUtils.currentUserId(), orderId));
    }
}
