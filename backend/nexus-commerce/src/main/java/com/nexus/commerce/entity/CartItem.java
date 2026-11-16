package com.nexus.commerce.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Một dòng hàng trong giỏ — bảng {@code nexus_commerce.cart_items} (§16, FR-16/17/18).
 *
 * <p>{@code cartId} giữ ở dạng {@code UUID} trần (không {@code @ManyToOne}) để giữ entity
 * phẳng, dễ đọc và tránh lazy-loading ngoài transaction. Repository lọc theo {@code cartId}.</p>
 *
 * <p>{@code productId}, {@code skuId}, {@code sellerId} là tham chiếu chéo module
 * ({@code nexus_catalog.products}, {@code nexus_fulfillment.skus}, {@code nexus_user.users}).
 * Giai đoạn CRUD nhận các giá trị này từ request — xem TODO (business logic) ở service.</p>
 */
@Entity
@Table(
        name = "cart_items",
        schema = "nexus_commerce",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_items_cart_product_sku",
                columnNames = {"cart_id", "product_id", "sku_id"}
        )
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem extends BaseEntity {

    /** Giỏ chứa dòng hàng này → {@code nexus_commerce.carts.id}. */
    @Column(name = "cart_id", nullable = false, updatable = false)
    private UUID cartId;

    /** Sản phẩm → {@code nexus_catalog.products.id}. */
    @Column(name = "product_id", nullable = false)
    private UUID productId;

    /** SKU cụ thể (nullable — sản phẩm chưa phân loại) → {@code nexus_fulfillment.skus.id}. */
    @Column(name = "sku_id")
    private UUID skuId;

    /** Seller bán sản phẩm → {@code nexus_user.users.id}; dùng để chặn checkout nhiều Seller (MVP). */
    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    /** Số lượng đặt mua; ràng buộc {@code > 0} ở cả DTO validation và CHECK constraint của DB. */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /** Giá đơn vị tại thời điểm thêm vào giỏ (snapshot) — phải lấy từ Catalog ở giai đoạn business logic. */
    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    /** Thành tiền của dòng = {@code unitPrice * quantity} (tính tại chỗ, không lưu cột riêng). */
    public BigDecimal lineTotal() {
        if (unitPrice == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
