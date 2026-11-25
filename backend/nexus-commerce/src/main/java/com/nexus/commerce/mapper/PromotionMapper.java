package com.nexus.commerce.mapper;

import com.nexus.commerce.dto.admin.CampaignResponse;
import com.nexus.commerce.dto.admin.DiscountCodeResponse;
import com.nexus.commerce.entity.DiscountCode;
import com.nexus.commerce.entity.PromotionCampaign;

import java.util.List;

/**
 * Mapper viết tay cho khuyến mãi: chiến dịch + mã giảm giá (§9, FR-46/47/48/58).
 */
public final class PromotionMapper {

    private PromotionMapper() {
    }

    public static CampaignResponse toResponse(PromotionCampaign entity) {
        return new CampaignResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus() == null ? null : entity.getStatus().name(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<CampaignResponse> toCampaignResponseList(List<PromotionCampaign> entities) {
        return entities.stream().map(PromotionMapper::toResponse).toList();
    }

    public static DiscountCodeResponse toResponse(DiscountCode entity) {
        return new DiscountCodeResponse(
                entity.getId(),
                entity.getCampaignId(),
                entity.getCode(),
                entity.getDiscountType() == null ? null : entity.getDiscountType().name(),
                MoneyUtils.money(entity.getDiscountValue()),
                MoneyUtils.money(entity.getMinOrderAmount()),
                entity.getUsageLimit(),
                entity.getUsedCount(),
                entity.getStartAt(),
                entity.getEndAt(),
                entity.getStatus() == null ? null : entity.getStatus().name(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<DiscountCodeResponse> toDiscountCodeResponseList(List<DiscountCode> entities) {
        return entities.stream().map(PromotionMapper::toResponse).toList();
    }
}
