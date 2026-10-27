package com.nexus.commerce.repository;

import com.nexus.commerce.entity.DiscountCode;
import com.nexus.commerce.enums.DiscountCodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn mã giảm giá (FR-20, FR-47, FR-48).
 *
 * <p>DB tạo unique index trên {@code upper(code)}. Service luôn chuẩn hoá code về chữ HOA
 * trước khi lưu và tra cứu, nên các derived query dưới đây so khớp chính xác là đủ và
 * không phân biệt hoa thường ở tầng API.</p>
 */
@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, UUID> {

    Optional<DiscountCode> findByCode(String code);

    boolean existsByCode(String code);

    Optional<DiscountCode> findByIdAndCampaignId(UUID id, UUID campaignId);

    Page<DiscountCode> findAllByStatus(DiscountCodeStatus status, Pageable pageable);

    Page<DiscountCode> findAllByCampaignId(UUID campaignId, Pageable pageable);
}
