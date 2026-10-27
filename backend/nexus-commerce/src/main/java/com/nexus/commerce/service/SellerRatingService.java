package com.nexus.commerce.service;

import com.nexus.commerce.dto.buyer.CreateSellerRatingRequest;
import com.nexus.commerce.dto.buyer.SellerRatingResponse;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Đánh giá Seller — FR-43 (Buyer gửi đánh giá), FR-44 (điểm 1..5 + nhận xét).
 */
public interface SellerRatingService {

    /**
     * FR-43/44 — Buyer đánh giá Seller sau khi đơn {@code COMPLETED}.
     *
     * <p>Ném {@code BusinessException} nếu đơn không thuộc Buyer hoặc chưa {@code COMPLETED};
     * ném {@code ForbiddenOperationException} nếu Buyer đánh giá đơn của người khác.</p>
     */
    SellerRatingResponse createRating(UUID buyerId, CreateSellerRatingRequest request);

    /** Danh sách đánh giá (đã ẩn hay chưa) của một Seller — phục vụ tra cứu của Buyer/Admin. */
    PageResponse<SellerRatingResponse> listSellerRatings(UUID sellerId, Pageable pageable);

    /** Danh sách đánh giá do chính Buyer viết. */
    PageResponse<SellerRatingResponse> listBuyerRatings(UUID buyerId, Pageable pageable);
}
