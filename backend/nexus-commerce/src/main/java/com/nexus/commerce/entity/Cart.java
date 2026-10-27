package com.nexus.commerce.entity;

import com.nexus.commerce.enums.CartStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Giỏ hàng của Buyer — bảng {@code nexus_commerce.carts} (§16, FR-15).
 *
 * <p>Quy tắc FR-15: mỗi Buyer chỉ có tối đa MỘT cart {@code ACTIVE}; được bảo vệ ở hai tầng —
 * service ({@code CartServiceImpl#getOrCreateActiveCart}) và unique partial index
 * {@code ux_carts_buyer_active} trong {@code db/04-commerce.sql}.</p>
 *
 * <p>{@code buyerId} là tham chiếu chéo module ({@code nexus_user.users}) nên chỉ giữ {@code UUID} trần,
 * KHÔNG có {@code @ManyToOne} (§4.10, §2).</p>
 */
@Entity
@Table(name = "carts", schema = "nexus_commerce")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Cart extends BaseEntity {

    /** Buyer sở hữu giỏ → {@code nexus_user.users.id}. */
    @Column(name = "buyer_id", nullable = false, updatable = false)
    private UUID buyerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CartStatus status;

    /** Tổng tiền hàng (chưa gồm phí vận chuyển/giảm giá); luôn được tính lại từ các cart item. */
    @Column(name = "subtotal", nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotal;
}
