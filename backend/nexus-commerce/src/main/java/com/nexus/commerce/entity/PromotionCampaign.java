package com.nexus.commerce.entity;

import com.nexus.commerce.enums.CampaignStatus;
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

import java.time.LocalDate;

/**
 * Chiến dịch khuyến mãi — bảng {@code nexus_commerce.promotion_campaigns} (§16, FR-46/58).
 *
 * <p>Chiến dịch gom nhiều mã giảm giá (xem {@link DiscountCode#getCampaignId()}).</p>
 * <p>Xoá chiến dịch = {@code status = ENDED} (không hard delete — §11.6).</p>
 */
@Entity
@Table(name = "promotion_campaigns", schema = "nexus_commerce")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionCampaign extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** Ngày bắt đầu hiệu lực (LocalDate — không cần giờ, theo §16). */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** Ngày kết thúc hiệu lực. */
    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CampaignStatus status;
}
