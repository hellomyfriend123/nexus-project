package com.nexus.commerce.entity;

import com.nexus.commerce.enums.DiscountCodeStatus;
import com.nexus.commerce.enums.DiscountType;
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
import java.time.Instant;
import java.util.UUID;

/**
 * Mã giảm giá — bảng {@code nexus_commerce.discount_codes} (§16, FR-20/47/48/58).
 *
 * <p>Ràng buộc duy nhất {@code code} (DB dùng unique index trên {@code upper(code)}).
 * Service luôn chuẩn hoá code về chữ HOA trước khi lưu/tra cứu ⇒ tra cứu không phân biệt hoa thường.</p>
 *
 * <p>{@code campaignId} là quan hệ <b>trong cùng module</b> nhưng vẫn giữ {@code UUID} trần
 * cho đơn giản, nhất quán với các entity khác trong module.</p>
 *
 * <p>Xoá mã = {@code status = INACTIVE} (không hard delete — §11.6).</p>
 */
@Entity
@Table(
        name = "discount_codes",
        schema = "nexus_commerce",
        uniqueConstraints = @UniqueConstraint(name = "uk_discount_codes_code", columnNames = "code")
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountCode extends BaseEntity {

    /** Chiến dịch chứa mã này (nullable) → {@code nexus_commerce.promotion_campaigns.id}. */
    @Column(name = "campaign_id")
    private UUID campaignId;

    /** Mã giảm giá, luôn lưu ở dạng chữ HOA. */
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    /** PERCENTAGE: phần trăm (0 < value <= 100); FIXED_AMOUNT: số tiền giảm. */
    @Column(name = "discount_value", nullable = false, precision = 19, scale = 2)
    private BigDecimal discountValue;

    /** Giá trị đơn tối thiểu để được áp dụng (FR-20). */
    @Column(name = "min_order_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal minOrderAmount;

    /** Tổng số lượt được dùng (nullable = không giới hạn). */
    @Column(name = "usage_limit")
    private Integer usageLimit;

    /** Số lượt đã dùng; chỉ tăng khi checkout thành công (không tăng ở bước xem trước giảm giá). */
    @Column(name = "used_count", nullable = false)
    private Integer usedCount;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DiscountCodeStatus status;

    /** Còn lượt dùng hay không (không giới hạn nếu {@code usageLimit} null). */
    public boolean hasRemainingUsage() {
        return usageLimit == null || usedCount == null || usedCount < usageLimit;
    }

    /** Ghi nhận thêm một lượt sử dụng (gọi trong transaction checkout). */
    public void incrementUsedCount() {
        this.usedCount = (usedCount == null ? 0 : usedCount) + 1;
    }
}
