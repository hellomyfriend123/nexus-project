package com.nexus.commerce.controller.admin;

import com.nexus.commerce.dto.admin.CampaignResponse;
import com.nexus.commerce.dto.admin.CreateCampaignRequest;
import com.nexus.commerce.dto.admin.CreateDiscountCodeRequest;
import com.nexus.commerce.dto.admin.DiscountCodeResponse;
import com.nexus.commerce.dto.admin.UpdateCampaignRequest;
import com.nexus.commerce.dto.admin.UpdateDiscountCodeRequest;
import com.nexus.commerce.dto.admin.UpdateDiscountCodeStatusRequest;
import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.dto.seller.UpdateOrderStatusRequest;
import com.nexus.commerce.enums.CampaignStatus;
import com.nexus.commerce.enums.DiscountCodeStatus;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.service.OrderService;
import com.nexus.commerce.service.PromotionService;
import com.nexus.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Commerce — Admin: quản lý đơn hàng (FR-56), huỷ đơn (FR-25), chiến dịch khuyến mãi (FR-46),
 * mã giảm giá (FR-47) và quản trị khuyến mãi (FR-58).
 *
 * <p>Không hard delete: "xoá" chiến dịch = {@code ENDED}, "xoá" mã giảm giá = {@code INACTIVE} (§11.6).</p>
 */
@RestController
@RequestMapping("/api/v1/admin/commerce")
@Tag(name = "Commerce — Admin",
        description = "FR-25, FR-46, FR-47, FR-56, FR-58 — quản lý đơn hàng và khuyến mãi")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CommerceAdminController {

    private final OrderService orderService;
    private final PromotionService promotionService;

    // ------------------------------------------------------------------ FR-56/25

    @GetMapping("/orders")
    @Operation(summary = "FR-56 — Admin xem mọi đơn hàng (lọc theo buyerId, sellerId, status)")
    @ApiResponse(responseCode = "200", description = "Danh sách đơn phân trang theo bộ lọc tuỳ chọn")
    public ResponseEntity<PageResponse<OrderSummaryResponse>> listOrders(
            @RequestParam(required = false) UUID buyerId,
            @RequestParam(required = false) UUID sellerId,
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(orderService.listOrdersForAdmin(buyerId, sellerId, status, pageable));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "FR-56 — Admin xem chi tiết một đơn hàng bất kỳ")
    @ApiResponse(responseCode = "200", description = "Chi tiết đơn hàng kèm danh sách dòng hàng")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderForAdmin(id));
    }

    @PatchMapping("/orders/{id}/status")
    @Operation(summary = "FR-56 — Admin cập nhật trạng thái đơn hàng (vẫn phải tuân chuỗi trạng thái hợp lệ)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trạng thái đã cập nhật"),
            @ApiResponse(responseCode = "422", description = "Nhảy cóc/lùi trạng thái hoặc đơn đã kết thúc")
    })
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable UUID id,
                                                           @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatusByAdmin(id, request.status()));
    }

    @PostMapping("/orders/{id}/cancel")
    @Operation(summary = "FR-25 — Admin huỷ một đơn hàng (chỉ khi đơn chưa kết thúc)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đơn đã chuyển sang CANCELLED"),
            @ApiResponse(responseCode = "422", description = "Đơn đã ở trạng thái kết thúc nên không huỷ được")
    })
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.cancelByAdmin(id));
    }

    // ------------------------------------------------------------- FR-46 / FR-58

    @GetMapping("/campaigns")
    @Operation(summary = "FR-46 — Admin xem danh sách chiến dịch khuyến mãi")
    @ApiResponse(responseCode = "200", description = "Danh sách chiến dịch phân trang, lọc theo status nếu truyền")
    public ResponseEntity<PageResponse<CampaignResponse>> listCampaigns(
            @RequestParam(required = false) CampaignStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(promotionService.listCampaigns(status, pageable));
    }

    @GetMapping("/campaigns/{id}")
    @Operation(summary = "FR-46 — Admin xem chi tiết một chiến dịch khuyến mãi")
    @ApiResponse(responseCode = "200", description = "Chi tiết chiến dịch")
    public ResponseEntity<CampaignResponse> getCampaign(@PathVariable UUID id) {
        return ResponseEntity.ok(promotionService.getCampaign(id));
    }

    @PostMapping("/campaigns")
    @Operation(summary = "FR-46 — Admin tạo chiến dịch khuyến mãi")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Chiến dịch đã tạo (mặc định DRAFT)"),
            @ApiResponse(responseCode = "409", description = "Tên chiến dịch đã tồn tại")
    })
    public ResponseEntity<CampaignResponse> createCampaign(@Valid @RequestBody CreateCampaignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.createCampaign(request));
    }

    @PutMapping("/campaigns/{id}")
    @Operation(summary = "FR-46 — Admin cập nhật chiến dịch khuyến mãi")
    @ApiResponse(responseCode = "200", description = "Chiến dịch đã cập nhật")
    public ResponseEntity<CampaignResponse> updateCampaign(@PathVariable UUID id,
                                                          @Valid @RequestBody UpdateCampaignRequest request) {
        return ResponseEntity.ok(promotionService.updateCampaign(id, request));
    }

    @DeleteMapping("/campaigns/{id}")
    @Operation(summary = "FR-46, FR-58 — Admin kết thúc chiến dịch (status = ENDED, không xoá cứng)")
    @ApiResponse(responseCode = "204", description = "Chiến dịch đã chuyển sang ENDED")
    public ResponseEntity<Void> deleteCampaign(@PathVariable UUID id) {
        promotionService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------- FR-47 / FR-58

    @GetMapping("/discount-codes")
    @Operation(summary = "FR-47 — Admin xem danh sách mã giảm giá (lọc theo status, campaignId)")
    @ApiResponse(responseCode = "200", description = "Danh sách mã giảm giá phân trang")
    public ResponseEntity<PageResponse<DiscountCodeResponse>> listDiscountCodes(
            @RequestParam(required = false) DiscountCodeStatus status,
            @RequestParam(required = false) UUID campaignId,
            Pageable pageable) {
        return ResponseEntity.ok(promotionService.listDiscountCodes(status, campaignId, pageable));
    }

    @GetMapping("/discount-codes/{id}")
    @Operation(summary = "FR-47 — Admin xem chi tiết một mã giảm giá")
    @ApiResponse(responseCode = "200", description = "Chi tiết mã giảm giá")
    public ResponseEntity<DiscountCodeResponse> getDiscountCode(@PathVariable UUID id) {
        return ResponseEntity.ok(promotionService.getDiscountCode(id));
    }

    @PostMapping("/discount-codes")
    @Operation(summary = "FR-47 — Admin tạo mã giảm giá (PERCENTAGE 0<value<=100 hoặc FIXED_AMOUNT)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Mã giảm giá đã tạo"),
            @ApiResponse(responseCode = "409", description = "Mã giảm giá đã tồn tại (code là duy nhất)")
    })
    public ResponseEntity<DiscountCodeResponse> createDiscountCode(
            @Valid @RequestBody CreateDiscountCodeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.createDiscountCode(request));
    }

    @PutMapping("/discount-codes/{id}")
    @Operation(summary = "FR-47 — Admin cập nhật mã giảm giá")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mã giảm giá đã cập nhật"),
            @ApiResponse(responseCode = "409", description = "Code mới trùng với mã khác")
    })
    public ResponseEntity<DiscountCodeResponse> updateDiscountCode(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDiscountCodeRequest request) {
        return ResponseEntity.ok(promotionService.updateDiscountCode(id, request));
    }

    @PatchMapping("/discount-codes/{id}/status")
    @Operation(summary = "FR-58 — Admin bật/tắt mã giảm giá (ACTIVE/INACTIVE thay cho xoá cứng)")
    @ApiResponse(responseCode = "200", description = "Trạng thái mã giảm giá đã cập nhật")
    public ResponseEntity<DiscountCodeResponse> updateDiscountCodeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDiscountCodeStatusRequest request) {
        return ResponseEntity.ok(promotionService.updateDiscountCodeStatus(id, request.status()));
    }
}
