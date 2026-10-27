package com.nexus.commerce.service;

import com.nexus.commerce.dto.admin.CampaignResponse;
import com.nexus.commerce.dto.admin.CreateCampaignRequest;
import com.nexus.commerce.dto.admin.CreateDiscountCodeRequest;
import com.nexus.commerce.dto.admin.DiscountCodeResponse;
import com.nexus.commerce.dto.admin.UpdateCampaignRequest;
import com.nexus.commerce.dto.admin.UpdateDiscountCodeRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountResponse;
import com.nexus.commerce.entity.DiscountCode;
import com.nexus.commerce.enums.CampaignStatus;
import com.nexus.commerce.enums.DiscountCodeStatus;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Khuyến mãi — FR-20/48 (Buyer áp mã), FR-46 (chiến dịch), FR-47 (mã giảm giá), FR-58 (quản trị).
 */
public interface PromotionService {

    /** FR-20/48 — xem trước số tiền được giảm; KHÔNG tiêu thụ lượt dùng. */
    ApplyDiscountResponse applyDiscount(UUID buyerId, ApplyDiscountRequest request);

    /**
     * Nội bộ cho checkout (FR-19): kiểm tra mã và trả về entity để tăng {@code usedCount}
     * trong cùng transaction. Ném {@code BusinessException} nếu mã không dùng được.
     */
    DiscountCode resolveForCheckout(String code, BigDecimal orderAmount);

    /**
     * Nội bộ cho checkout: tính số tiền được giảm của một mã đã resolve.
     * PERCENTAGE: {@code amount * value / 100}; FIXED_AMOUNT: không vượt quá {@code amount}.
     * Kết quả làm tròn {@code setScale(2, HALF_UP)}.
     */
    BigDecimal calculateDiscountAmount(DiscountCode discountCode, BigDecimal amount);

    /** Nội bộ cho checkout: ghi nhận một lượt sử dụng của mã. */
    void registerUsage(DiscountCode discountCode);

    // ------------------------------------------------------------------ FR-46 / FR-58

    PageResponse<CampaignResponse> listCampaigns(CampaignStatus status, Pageable pageable);

    CampaignResponse getCampaign(UUID campaignId);

    CampaignResponse createCampaign(CreateCampaignRequest request);

    CampaignResponse updateCampaign(UUID campaignId, UpdateCampaignRequest request);

    /** "Xoá" chiến dịch = chuyển trạng thái sang {@code ENDED} (không hard delete). */
    void deleteCampaign(UUID campaignId);

    // ------------------------------------------------------------------ FR-47 / FR-58

    PageResponse<DiscountCodeResponse> listDiscountCodes(DiscountCodeStatus status, UUID campaignId, Pageable pageable);

    DiscountCodeResponse getDiscountCode(UUID discountCodeId);

    DiscountCodeResponse createDiscountCode(CreateDiscountCodeRequest request);

    DiscountCodeResponse updateDiscountCode(UUID discountCodeId, UpdateDiscountCodeRequest request);

    /** FR-58 — bật/tắt mã thay cho xoá cứng. */
    DiscountCodeResponse updateDiscountCodeStatus(UUID discountCodeId, DiscountCodeStatus status);
}
