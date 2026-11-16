package com.nexus.commerce.entity;

import com.nexus.commerce.enums.RatingStatus;
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

import java.util.UUID;

/**
 * Đánh giá Seller của Buyer — bảng {@code nexus_commerce.seller_ratings} (§16, FR-43/44).
 *
 * <p>Điều kiện nghiệp vụ (kiểm tra ngay trong giai đoạn CRUD, không cần module khác):
 * đơn phải thuộc chính Buyer đang đăng nhập và phải ở trạng thái {@code COMPLETED}.</p>
 *
 * <p>Không hard delete: Admin ẩn đánh giá bằng {@code status = HIDDEN} (FR-58).</p>
 */
@Entity
@Table(name = "seller_ratings", schema = "nexus_commerce")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRating extends BaseEntity {

    /** Đơn hàng được đánh giá → {@code nexus_commerce.orders.id}. */
    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    /** Seller được đánh giá → {@code nexus_user.users.id}. */
    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;

    /** Buyer viết đánh giá → {@code nexus_user.users.id}; luôn lấy từ token, không nhận từ request. */
    @Column(name = "buyer_id", nullable = false, updatable = false)
    private UUID buyerId;

    /** Điểm 1..5 (ràng buộc cả ở DTO validation và CHECK constraint của DB). */
    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RatingStatus status;
}
