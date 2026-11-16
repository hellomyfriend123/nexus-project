package com.nexus.commerce.entity;

import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.enums.OrderType;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Đơn hàng — bảng {@code nexus_commerce.orders} (§16, FR-22/23/24/25/56).
 *
 * <p><b>MVP: một đơn chỉ thuộc MỘT Seller</b> ({@code sellerId} là cột {@code NOT NULL}).
 * Nếu giỏ có hàng của nhiều Seller, checkout bị chặn bằng {@code BusinessException} — xem
 * {@code CheckoutServiceImpl}.</p>
 *
 * <p>Các cột tiền đều là {@code BigDecimal(19,2)} và được làm tròn {@code HALF_UP}:
 * {@code totalAmount = subtotal - discount + shippingFee}.</p>
 *
 * <p><b>Không hard delete</b> (§11.6): huỷ đơn = {@code status = CANCELLED}. Đơn hàng không có
 * {@code deletedAt}.</p>
 */
@Entity
@Table(
        name = "orders",
        schema = "nexus_commerce",
        uniqueConstraints = @UniqueConstraint(name = "uk_orders_order_number", columnNames = "order_number")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {

    /** Mã đơn hiển thị cho người dùng, dạng {@code ORD-yyyyMMdd-XXXXXX}, duy nhất toàn hệ thống. */
    @Column(name = "order_number", nullable = false, length = 50, updatable = false)
    private String orderNumber;

    /** Buyer đặt đơn → {@code nexus_user.users.id}. */
    @Column(name = "buyer_id", nullable = false, updatable = false)
    private UUID buyerId;

    /** Seller của đơn (MVP: 1 đơn = 1 seller) → {@code nexus_user.users.id}. */
    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    private OrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status;

    /** Tổng tiền hàng trước giảm giá và phí vận chuyển. */
    @Column(name = "subtotal", nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotal;

    /** Số tiền được giảm từ mã giảm giá (FR-20/48). */
    @Column(name = "discount", nullable = false, precision = 19, scale = 2)
    private BigDecimal discount;

    @Column(name = "shipping_fee", nullable = false, precision = 19, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    /** Snapshot địa chỉ giao hàng tại thời điểm đặt (FR-19) — không tham chiếu bảng Address nào. */
    @Column(name = "shipping_address", nullable = false, columnDefinition = "text")
    private String shippingAddress;

    @Column(name = "receiver_name", length = 150)
    private String receiverName;

    @Column(name = "receiver_phone", length = 20)
    private String receiverPhone;

    /** Mã giảm giá đã dùng (nullable) — lưu chuỗi để hoá đơn cũ không phụ thuộc bảng discount_codes. */
    @Column(name = "discount_code", length = 50)
    private String discountCode;

    /** Tiện ích cho service: đơn đã kết thúc (COMPLETED/CANCELLED) thì không đổi được nữa. */
    public boolean isTerminal() {
        return status != null && status.isTerminal();
    }
}
