package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.admin.CampaignResponse;
import com.nexus.commerce.dto.admin.CreateCampaignRequest;
import com.nexus.commerce.dto.admin.CreateDiscountCodeRequest;
import com.nexus.commerce.dto.admin.DiscountCodeResponse;
import com.nexus.commerce.dto.admin.UpdateCampaignRequest;
import com.nexus.commerce.dto.admin.UpdateDiscountCodeRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountRequest;
import com.nexus.commerce.dto.buyer.ApplyDiscountResponse;
import com.nexus.commerce.entity.DiscountCode;
import com.nexus.commerce.entity.PromotionCampaign;
import com.nexus.commerce.enums.CampaignStatus;
import com.nexus.commerce.enums.DiscountCodeStatus;
import com.nexus.commerce.enums.DiscountType;
import com.nexus.commerce.enums.OrderType;
import com.nexus.commerce.mapper.MoneyUtils;
import com.nexus.commerce.mapper.PromotionMapper;
import com.nexus.commerce.repository.DiscountCodeRepository;
import com.nexus.commerce.repository.PromotionCampaignRepository;
import com.nexus.commerce.service.PromotionService;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

/**
 * Cài đặt khuyến mãi — FR-20/48 (Buyer áp mã), FR-46 (chiến dịch), FR-47 (mã giảm giá), FR-58 (quản trị).
 *
 * <p><b>Luật áp mã (FR-20/48):</b> mã phải tồn tại → {@code ACTIVE} → trong khoảng {@code startAt/endAt}
 * → {@code orderAmount >= minOrderAmount} → {@code usedCount < usageLimit}. Thiếu một điều kiện là
 * {@code BusinessException} với thông báo tiếng Việt nêu rõ lý do.</p>
 *
 * <p><b>Đơn đấu giá không được giảm giá:</b> {@code orderType = AUCTION} ⇒ từ chối ngay.</p>
 *
 * <p><b>Code không phân biệt hoa thường</b>: service luôn chuẩn hoá về chữ HOA (khớp unique index
 * {@code upper(code)} trong DB).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PromotionServiceImpl implements PromotionService {

    private static final int MAX_CODE_LENGTH = 50;
    private static final BigDecimal MAX_PERCENTAGE = new BigDecimal("100");

    private final PromotionCampaignRepository campaignRepository;
    private final DiscountCodeRepository discountCodeRepository;

    // ------------------------------------------------------------- FR-20 / FR-48

    @Override
    @Transactional(readOnly = true)
    public ApplyDiscountResponse applyDiscount(UUID buyerId, ApplyDiscountRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu áp dụng mã giảm giá");
        }
        OrderType orderType = request.orderType() == null ? OrderType.DIRECT : request.orderType();
        if (orderType == OrderType.AUCTION) {
            throw new BusinessException("Đơn đấu giá không được áp dụng mã giảm giá");
        }

        BigDecimal orderAmount = MoneyUtils.money(request.orderAmount());
        if (orderAmount.signum() <= 0) {
            throw new BusinessException("Giá trị đơn hàng phải lớn hơn 0 để áp dụng mã giảm giá");
        }

        DiscountCode discountCode = resolveForCheckout(request.code(), orderAmount);
        BigDecimal discountAmount = calculateDiscountAmount(discountCode, orderAmount);

        return new ApplyDiscountResponse(
                discountCode.getCode(),
                discountCode.getDiscountType().name(),
                orderAmount,
                discountAmount,
                MoneyUtils.money(orderAmount.subtract(discountAmount))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountCode resolveForCheckout(String code, BigDecimal orderAmount) {
        String normalized = normalizeCode(code);
        BigDecimal amount = MoneyUtils.money(orderAmount);

        DiscountCode discountCode = discountCodeRepository.findByCode(normalized)
                .orElseThrow(() -> new BusinessException("Mã giảm giá không tồn tại: " + normalized));

        if (discountCode.getStatus() != DiscountCodeStatus.ACTIVE) {
            throw new BusinessException("Mã giảm giá đang không hoạt động: " + normalized);
        }

        Instant now = Instant.now();
        if (discountCode.getStartAt() != null && now.isBefore(discountCode.getStartAt())) {
            throw new BusinessException("Mã giảm giá chưa đến thời gian sử dụng: " + normalized);
        }
        if (discountCode.getEndAt() != null && now.isAfter(discountCode.getEndAt())) {
            throw new BusinessException("Mã giảm giá đã hết hạn: " + normalized);
        }

        BigDecimal minOrderAmount = MoneyUtils.money(discountCode.getMinOrderAmount());
        if (amount.compareTo(minOrderAmount) < 0) {
            throw new BusinessException("Đơn hàng tối thiểu " + minOrderAmount + " mới dùng được mã " + normalized);
        }

        if (!discountCode.hasRemainingUsage()) {
            throw new BusinessException("Mã giảm giá đã hết lượt sử dụng: " + normalized);
        }

        return discountCode;
    }

    @Override
    public BigDecimal calculateDiscountAmount(DiscountCode discountCode, BigDecimal amount) {
        if (discountCode == null) {
            throw new BusinessException("Chưa xác định được mã giảm giá");
        }
        BigDecimal base = MoneyUtils.money(amount);
        BigDecimal value = discountCode.getDiscountValue() == null ? BigDecimal.ZERO : discountCode.getDiscountValue();

        BigDecimal discount = switch (discountCode.getDiscountType()) {
            // PERCENTAGE: amount * value / 100
            case PERCENTAGE -> base.multiply(value).divide(MAX_PERCENTAGE, MoneyUtils.SCALE, RoundingMode.HALF_UP);
            // FIXED_AMOUNT: giảm thẳng nhưng KHÔNG vượt quá giá trị đơn.
            case FIXED_AMOUNT -> value.min(base);
        };

        return discount.max(BigDecimal.ZERO).min(base).setScale(MoneyUtils.SCALE, RoundingMode.HALF_UP);
    }

    @Override
    public void registerUsage(DiscountCode discountCode) {
        if (discountCode == null || discountCode.getId() == null) {
            return;
        }
        discountCode.incrementUsedCount();
        discountCodeRepository.save(discountCode);
    }

    // ------------------------------------------------------------- FR-46 / FR-58

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CampaignResponse> listCampaigns(CampaignStatus status, Pageable pageable) {
        Page<PromotionCampaign> page = status == null
                ? campaignRepository.findAll(pageable)
                : campaignRepository.findAllByStatus(status, pageable);
        return PageResponse.from(page, PromotionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getCampaign(UUID campaignId) {
        return PromotionMapper.toResponse(requireCampaign(campaignId));
    }

    @Override
    public CampaignResponse createCampaign(CreateCampaignRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu chiến dịch khuyến mãi");
        }
        validateCampaignPeriod(request.startDate(), request.endDate());

        String name = request.name() == null ? null : request.name().trim();
        if (name == null || name.isEmpty()) {
            throw new BusinessException("Tên chiến dịch không được để trống");
        }
        if (campaignRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Chiến dịch khuyến mãi", "name", name);
        }

        PromotionCampaign campaign = PromotionCampaign.builder()
                .name(name)
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(request.status() == null ? CampaignStatus.DRAFT : request.status())
                .build();

        return PromotionMapper.toResponse(campaignRepository.save(campaign));
    }

    @Override
    public CampaignResponse updateCampaign(UUID campaignId, UpdateCampaignRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu cập nhật chiến dịch khuyến mãi");
        }
        PromotionCampaign campaign = requireCampaign(campaignId);
        validateCampaignPeriod(request.startDate(), request.endDate());

        String name = request.name() == null ? null : request.name().trim();
        if (name == null || name.isEmpty()) {
            throw new BusinessException("Tên chiến dịch không được để trống");
        }
        if (!name.equalsIgnoreCase(campaign.getName()) && campaignRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Chiến dịch khuyến mãi", "name", name);
        }

        campaign.setName(name);
        campaign.setDescription(request.description());
        campaign.setStartDate(request.startDate());
        campaign.setEndDate(request.endDate());
        if (request.status() != null) {
            campaign.setStatus(request.status());
        }

        return PromotionMapper.toResponse(campaignRepository.save(campaign));
    }

    @Override
    public void deleteCampaign(UUID campaignId) {
        PromotionCampaign campaign = requireCampaign(campaignId);
        // Không hard delete: đánh dấu chiến dịch đã kết thúc (§11.6).
        campaign.setStatus(CampaignStatus.ENDED);
        campaignRepository.save(campaign);
    }

    // ------------------------------------------------------------- FR-47 / FR-58

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DiscountCodeResponse> listDiscountCodes(DiscountCodeStatus status, UUID campaignId,
                                                                Pageable pageable) {
        Page<DiscountCode> page;
        if (campaignId != null) {
            page = discountCodeRepository.findAllByCampaignId(campaignId, pageable);
        } else if (status != null) {
            page = discountCodeRepository.findAllByStatus(status, pageable);
        } else {
            page = discountCodeRepository.findAll(pageable);
        }
        return PageResponse.from(page, PromotionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountCodeResponse getDiscountCode(UUID discountCodeId) {
        return PromotionMapper.toResponse(requireDiscountCode(discountCodeId));
    }

    @Override
    public DiscountCodeResponse createDiscountCode(CreateDiscountCodeRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu mã giảm giá");
        }
        String code = normalizeCode(request.code());
        validateDiscountValue(request.discountType(), request.discountValue());
        requireMinOrderAmount(request.minOrderAmount());
        requireCampaignIfPresent(request.campaignId());

        // FR-47: code là duy nhất trong toàn hệ thống.
        if (discountCodeRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Mã giảm giá", "code", code);
        }

        DiscountCode discountCode = DiscountCode.builder()
                .campaignId(request.campaignId())
                .code(code)
                .discountType(request.discountType())
                .discountValue(MoneyUtils.money(request.discountValue()))
                .minOrderAmount(MoneyUtils.money(request.minOrderAmount()))
                .usageLimit(request.usageLimit())
                .usedCount(0)
                .startAt(request.startAt())
                .endAt(request.endAt())
                .status(request.status() == null ? DiscountCodeStatus.ACTIVE : request.status())
                .build();

        return PromotionMapper.toResponse(discountCodeRepository.save(discountCode));
    }

    @Override
    public DiscountCodeResponse updateDiscountCode(UUID discountCodeId, UpdateDiscountCodeRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu cập nhật mã giảm giá");
        }
        DiscountCode discountCode = requireDiscountCode(discountCodeId);
        String code = normalizeCode(request.code());
        validateDiscountValue(request.discountType(), request.discountValue());
        requireMinOrderAmount(request.minOrderAmount());
        requireCampaignIfPresent(request.campaignId());

        if (!code.equals(discountCode.getCode()) && discountCodeRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Mã giảm giá", "code", code);
        }

        discountCode.setCampaignId(request.campaignId());
        discountCode.setCode(code);
        discountCode.setDiscountType(request.discountType());
        discountCode.setDiscountValue(MoneyUtils.money(request.discountValue()));
        discountCode.setMinOrderAmount(MoneyUtils.money(request.minOrderAmount()));
        discountCode.setUsageLimit(request.usageLimit());
        discountCode.setStartAt(request.startAt());
        discountCode.setEndAt(request.endAt());
        if (request.status() != null) {
            discountCode.setStatus(request.status());
        }
        // usedCount KHÔNG sửa qua API — chỉ service tăng khi checkout thành công.

        return PromotionMapper.toResponse(discountCodeRepository.save(discountCode));
    }

    @Override
    public DiscountCodeResponse updateDiscountCodeStatus(UUID discountCodeId, DiscountCodeStatus status) {
        if (status == null) {
            throw new BusinessException("Trạng thái mã giảm giá không được để trống");
        }
        DiscountCode discountCode = requireDiscountCode(discountCodeId);
        discountCode.setStatus(status);
        return PromotionMapper.toResponse(discountCodeRepository.save(discountCode));
    }

    // ------------------------------------------------------------------ nội bộ

    private PromotionCampaign requireCampaign(UUID campaignId) {
        return campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Chiến dịch khuyến mãi", campaignId));
    }

    private DiscountCode requireDiscountCode(UUID discountCodeId) {
        return discountCodeRepository.findById(discountCodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá", discountCodeId));
    }

    /** Chuẩn hoá code về chữ HOA, bỏ khoảng trắng; khớp unique index {@code upper(code)} của DB. */
    private String normalizeCode(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException("Mã giảm giá không được để trống");
        }
        String code = raw.trim().toUpperCase(Locale.ROOT);
        if (code.length() > MAX_CODE_LENGTH) {
            throw new BusinessException("Mã giảm giá tối đa " + MAX_CODE_LENGTH + " ký tự");
        }
        return code;
    }

    /** FR-47: PERCENTAGE phải trong khoảng (0, 100]; FIXED_AMOUNT phải lớn hơn 0. */
    private void validateDiscountValue(DiscountType type, BigDecimal value) {
        if (type == null) {
            throw new BusinessException("Loại giảm giá không được để trống");
        }
        if (value == null || value.signum() <= 0) {
            throw new BusinessException("Giá trị giảm giá phải lớn hơn 0");
        }
        if (type == DiscountType.PERCENTAGE && value.compareTo(MAX_PERCENTAGE) > 0) {
            throw new BusinessException("Giảm giá theo phần trăm phải nằm trong khoảng 0 < giá trị <= 100");
        }
    }

    private void requireMinOrderAmount(BigDecimal minOrderAmount) {
        if (minOrderAmount == null || minOrderAmount.signum() < 0) {
            throw new BusinessException("Giá trị đơn tối thiểu không được âm");
        }
    }

    /** Nếu có gắn chiến dịch thì chiến dịch đó phải tồn tại (không tạo mã trỏ vào campaign lạ). */
    private void requireCampaignIfPresent(UUID campaignId) {
        if (campaignId != null && !campaignRepository.existsById(campaignId)) {
            throw new ResourceNotFoundException("Chiến dịch khuyến mãi", campaignId);
        }
    }

    private void validateCampaignPeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BusinessException("Ngày kết thúc chiến dịch phải sau hoặc bằng ngày bắt đầu");
        }
    }
}
