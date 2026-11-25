package com.nexus.commerce.controller.buyer;

import com.nexus.commerce.dto.buyer.AddCartItemRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountResponse;
import com.nexus.commerce.dto.buyer.CartResponse;
import com.nexus.commerce.dto.buyer.CheckoutRequest;
import com.nexus.commerce.dto.buyer.ConfirmPaymentRequest;
import com.nexus.commerce.dto.buyer.CreatePaymentRequest;
import com.nexus.commerce.dto.buyer.CreateSellerRatingRequest;
import com.nexus.commerce.dto.buyer.OrderResponse;
import com.nexus.commerce.dto.buyer.OrderSummaryResponse;
import com.nexus.commerce.dto.buyer.PaymentResponse;
import com.nexus.commerce.dto.buyer.SellerRatingResponse;
import com.nexus.commerce.dto.buyer.UpdateCartItemRequest;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.enums.PaymentStatus;
import com.nexus.commerce.service.CartService;
import com.nexus.commerce.service.CheckoutService;
import com.nexus.commerce.service.OrderService;
import com.nexus.commerce.service.PaymentService;
import com.nexus.commerce.service.PromotionService;
import com.nexus.commerce.service.SellerRatingService;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.security.SecurityUtils;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Commerce — Buyer: giỏ hàng, checkout, đơn hàng, thanh toán, đánh giá Seller.
 * FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-23, FR-25, FR-43, FR-44, FR-48.
 *
 * <p>Controller chỉ map request → service → response, không chứa business logic (§7.6).
 * {@code buyerId} luôn lấy từ token qua {@link SecurityUtils#currentUserId()} — KHÔNG nhận từ request (§7.5).</p>
 */
@RestController
@RequestMapping("/api/v1/buyer/commerce")
@Tag(name = "Commerce — Buyer",
        description = "FR-15..FR-23, FR-25, FR-43, FR-44, FR-48 — giỏ hàng, đặt hàng, thanh toán, đánh giá Seller")
@RequiredArgsConstructor
@PreAuthorize("hasRole('BUYER')")
public class CommerceBuyerController {

    private final CartService cartService;
    private final CheckoutService checkoutService;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final PromotionService promotionService;
    private final SellerRatingService sellerRatingService;

    // ------------------------------------------------------------------ FR-15..18

    @GetMapping("/cart")
    @Operation(summary = "FR-15 — Buyer xem giỏ hàng đang hoạt động (tạo mới nếu chưa có)")
    @ApiResponse(responseCode = "200", description = "Trả về giỏ ACTIVE; nếu Buyer chưa có giỏ thì hệ thống tạo mới")
    public ResponseEntity<CartResponse> getCart() {
        return ResponseEntity.ok(cartService.getOrCreateActiveCart(SecurityUtils.currentUserId()));
    }

    @PostMapping("/cart/items")
    @Operation(summary = "FR-16 — Buyer thêm sản phẩm vào giỏ (trùng sản phẩm + SKU thì cộng dồn số lượng)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Đã thêm vào giỏ; trả về giỏ sau khi cập nhật"),
            @ApiResponse(responseCode = "422", description = "Số lượng hoặc đơn giá không hợp lệ")
    })
    public ResponseEntity<CartResponse> addCartItem(@Valid @RequestBody AddCartItemRequest request) {
        CartResponse response = cartService.addItem(SecurityUtils.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/cart/items/{itemId}")
    @Operation(summary = "FR-17 — Buyer đổi số lượng một dòng hàng trong giỏ")
    @ApiResponse(responseCode = "200", description = "Số lượng đã đổi, subtotal của giỏ được tính lại")
    public ResponseEntity<CartResponse> updateCartItem(@PathVariable UUID itemId,
                                                       @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(cartService.updateItem(SecurityUtils.currentUserId(), itemId, request));
    }

    @DeleteMapping("/cart/items/{itemId}")
    @Operation(summary = "FR-18 — Buyer xoá một dòng hàng khỏi giỏ")
    @ApiResponse(responseCode = "204", description = "Đã xoá dòng hàng")
    public ResponseEntity<Void> removeCartItem(@PathVariable UUID itemId) {
        cartService.removeItem(SecurityUtils.currentUserId(), itemId);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------ FR-19/20/22/48

    @PostMapping("/checkout")
    @Operation(summary = "FR-19, FR-22 — Buyer đặt hàng từ giỏ (sinh Order + OrderItem, giỏ chuyển CONVERTED)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Đơn hàng đã tạo, orderNumber dạng ORD-yyyyMMdd-XXXXXX"),
            @ApiResponse(responseCode = "422",
                    description = "Giỏ trống, giỏ có nhiều Seller (giới hạn MVP) hoặc mã giảm giá không hợp lệ")
    })
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = checkoutService.checkout(SecurityUtils.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/checkout/apply-discount")
    @Operation(summary = "FR-20, FR-48 — Buyer xem trước số tiền được giảm của một mã giảm giá")
    @ApiResponse(responseCode = "200", description = "Số tiền giảm đã tính; KHÔNG tiêu thụ lượt dùng của mã")
    public ResponseEntity<ApplyDiscountResponse> applyDiscount(@Valid @RequestBody ApplyDiscountRequest request) {
        return ResponseEntity.ok(promotionService.applyDiscount(SecurityUtils.currentUserId(), request));
    }

    // ------------------------------------------------------------------ FR-23/25

    @GetMapping("/orders")
    @Operation(summary = "FR-23 — Buyer xem danh sách đơn hàng của chính mình")
    @ApiResponse(responseCode = "200", description = "Danh sách đơn phân trang; lọc theo status nếu truyền")
    public ResponseEntity<PageResponse<OrderSummaryResponse>> listMyOrders(
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(orderService.listBuyerOrders(SecurityUtils.currentUserId(), status, pageable));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "FR-23 — Buyer xem chi tiết một đơn hàng của chính mình")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Chi tiết đơn hàng kèm danh sách dòng hàng"),
            @ApiResponse(responseCode = "403", description = "Đơn hàng thuộc Buyer khác")
    })
    public ResponseEntity<OrderResponse> getMyOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getBuyerOrder(SecurityUtils.currentUserId(), id));
    }

    @PostMapping("/orders/{id}/cancel")
    @Operation(summary = "FR-25 — Buyer huỷ đơn hàng của mình (chỉ khi đơn chưa kết thúc)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đơn đã chuyển sang CANCELLED"),
            @ApiResponse(responseCode = "422", description = "Đơn đã ở trạng thái kết thúc nên không huỷ được")
    })
    public ResponseEntity<OrderResponse> cancelMyOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.cancelByBuyer(SecurityUtils.currentUserId(), id));
    }

    // -------------------------------------------------------------------- FR-21

    @PostMapping("/orders/{id}/payments")
    @Operation(summary = "FR-21 — Buyer tạo giao dịch thanh toán cho đơn (idempotent theo idempotencyKey)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Giao dịch PENDING được tạo mới, hoặc trả lại giao dịch cũ"),
            @ApiResponse(responseCode = "422", description = "Đơn đã huỷ/đã có giao dịch thành công")
    })
    public ResponseEntity<PaymentResponse> createPayment(@PathVariable UUID id,
                                                        @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(SecurityUtils.currentUserId(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/payments/{id}/confirm")
    @Operation(summary = "FR-21 — Xác nhận kết quả giao dịch; SUCCESS thì đơn chuyển CONFIRMED")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đã cập nhật trạng thái giao dịch"),
            @ApiResponse(responseCode = "422", description = "result không phải SUCCESS/FAILED hoặc giao dịch không hợp lệ")
    })
    public ResponseEntity<PaymentResponse> confirmPayment(@PathVariable UUID id,
                                                         @Valid @RequestBody ConfirmPaymentRequest request) {
        PaymentStatus result = PaymentStatus.parse(request.result())
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "Kết quả giao dịch chỉ nhận SUCCESS hoặc FAILED"));
        return ResponseEntity.ok(paymentService.confirmPayment(SecurityUtils.currentUserId(), id, result));
    }

    // -------------------------------------------------------------- FR-43 / FR-44

    @PostMapping("/seller-ratings")
    @Operation(summary = "FR-43, FR-44 — Buyer đánh giá Seller sau khi đơn đã COMPLETED")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Đã ghi nhận đánh giá"),
            @ApiResponse(responseCode = "409", description = "Đã đánh giá Seller này cho đơn hàng này"),
            @ApiResponse(responseCode = "422", description = "Đơn chưa COMPLETED hoặc điểm không trong 1..5")
    })
    public ResponseEntity<SellerRatingResponse> createSellerRating(
            @Valid @RequestBody CreateSellerRatingRequest request) {
        SellerRatingResponse response = sellerRatingService.createRating(SecurityUtils.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
