package com.nexus.commerce.controller.seller;

import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.dto.seller.UpdateOrderStatusRequest;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.service.OrderService;
import com.nexus.common.api.PageResponse;
import com.nexus.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
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
 * Commerce — Seller: xem đơn của mình, cập nhật trạng thái, huỷ đơn.
 * FR-23, FR-24, FR-25.
 *
 * <p>Mọi truy vấn đều lọc theo {@code sellerId} lấy từ token — Seller không thể đọc/ghi đơn của Seller khác.
 * Sai chủ sở hữu ⇒ {@code ForbiddenOperationException} (403).</p>
 */
@RestController
@RequestMapping("/api/v1/seller/commerce")
@Tag(name = "Commerce — Seller", description = "FR-23, FR-24, FR-25 — quản lý đơn hàng của Seller")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class CommerceSellerController {

    private final OrderService orderService;

    @GetMapping("/orders")
    @Operation(summary = "FR-23 — Seller xem danh sách đơn hàng của mình")
    @ApiResponse(responseCode = "200", description = "Danh sách đơn phân trang; lọc theo status nếu truyền")
    public ResponseEntity<PageResponse<OrderSummaryResponse>> listOrders(
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(orderService.listSellerOrders(SecurityUtils.currentUserId(), status, pageable));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "FR-23 — Seller xem chi tiết một đơn hàng của mình")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Chi tiết đơn hàng kèm danh sách dòng hàng"),
            @ApiResponse(responseCode = "403", description = "Đơn hàng thuộc Seller khác")
    })
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getSellerOrder(SecurityUtils.currentUserId(), id));
    }

    @PatchMapping("/orders/{id}/status")
    @Operation(summary = "FR-24 — Seller cập nhật trạng thái đơn theo chuỗi PENDING → CONFIRMED → SHIPPING → COMPLETED")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trạng thái đã cập nhật"),
            @ApiResponse(responseCode = "422",
                    description = "Nhảy cóc/lùi trạng thái hoặc đơn đã ở trạng thái kết thúc")
    })
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable UUID id,
                                                           @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(
                orderService.updateStatusBySeller(SecurityUtils.currentUserId(), id, request.status()));
    }

    @PostMapping("/orders/{id}/cancel")
    @Operation(summary = "FR-25 — Seller huỷ đơn hàng của mình (chỉ khi đơn chưa kết thúc)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đơn đã chuyển sang CANCELLED"),
            @ApiResponse(responseCode = "422", description = "Đơn đã ở trạng thái kết thúc nên không huỷ được")
    })
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.cancelBySeller(SecurityUtils.currentUserId(), id));
    }
}
