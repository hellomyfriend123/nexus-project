package com.nexus.commerce.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Dòng hàng của đơn — bảng {@code nexus_commerce.order_items} (§16, FR-22).
 *
 * <p>Đây là <b>snapshot</b> tại thời điểm đặt hàng: {@code productNameSnapshot}, {@code skuCodeSnapshot},
 * {@code unitPrice}. Nhờ vậy sản phẩm đổi tên/đổi giá sau này không làm sai hoá đơn cũ.</p>
 */
@Entity
@Table(name = "order_items", schema = "nexus_commerce")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem extends BaseEntity {

    /** Đơn chứa dòng hàng → {@code nexus_commerce.orders.id}. */
    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "sku_id")
    private UUID skuId;

    @Column(name = "seller_id")
    private UUID sellerId;

    /** Tên sản phẩm tại thời điểm đặt. */
    @Column(name = "product_name_snapshot", nullable = false, length = 255)
    private String productNameSnapshot;

    /** Mã SKU tại thời điểm đặt (nullable — có thể lấy từ Catalog ở giai đoạn business logic). */
    @Column(name = "sku_code_snapshot", length = 50)
    private String skuCodeSnapshot;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    /** Thành tiền dòng = {@code unitPrice * quantity}. */
    @Column(name = "subtotal", nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotal;
}
