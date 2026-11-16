package com.nexus.commerce.repository;

import com.nexus.commerce.entity.SellerRating;
import com.nexus.commerce.enums.RatingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn đánh giá Seller (FR-43/44, FR-58).
 * Đánh giá không bị xoá cứng: Admin đổi {@code status} sang {@code HIDDEN}.
 */
@Repository
public interface SellerRatingRepository extends JpaRepository<SellerRating, UUID> {

    Page<SellerRating> findAllBySellerId(UUID sellerId, Pageable pageable);

    Page<SellerRating> findAllBySellerIdAndStatus(UUID sellerId, RatingStatus status, Pageable pageable);

    Page<SellerRating> findAllByStatus(RatingStatus status, Pageable pageable);

    /** FR-43: một Buyer chỉ đánh giá một Seller một lần cho mỗi đơn. */
    boolean existsByOrderIdAndSellerIdAndBuyerId(UUID orderId, UUID sellerId, UUID buyerId);

    Optional<SellerRating> findByIdAndBuyerId(UUID id, UUID buyerId);

    Page<SellerRating> findAllByBuyerId(UUID buyerId, Pageable pageable);
}
