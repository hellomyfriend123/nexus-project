package com.nexus.commerce.repository;

import com.nexus.commerce.entity.PromotionCampaign;
import com.nexus.commerce.enums.CampaignStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Truy vấn chiến dịch khuyến mãi (FR-46, FR-58).
 * "Xoá" chiến dịch = {@code status = ENDED}; bản ghi vẫn còn để tra soát.
 */
@Repository
public interface PromotionCampaignRepository extends JpaRepository<PromotionCampaign, UUID> {

    Page<PromotionCampaign> findAllByStatus(CampaignStatus status, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}
