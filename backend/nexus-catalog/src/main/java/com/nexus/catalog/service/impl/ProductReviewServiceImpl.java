package com.nexus.catalog.service.impl;

import com.nexus.catalog.dto.admin.UpdateReviewStatusRequest;
import com.nexus.catalog.dto.buyer.CreateReviewRequest;
import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.entity.Product;
import com.nexus.catalog.entity.ProductReview;
import com.nexus.catalog.enums.ReviewStatus;
import com.nexus.catalog.mapper.ProductReviewMapper;
import com.nexus.catalog.repository.ProductRepository;
import com.nexus.catalog.repository.ProductReviewRepository;
import com.nexus.catalog.service.ProductReviewService;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Cài đặt nghiệp vụ đánh giá sản phẩm (FR-41, FR-42, FR-45, FR-59).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProductReviewServiceImpl implements ProductReviewService {

    private static final int MIN_SCORE = 1;
    private static final int MAX_SCORE = 5;

    private final ProductReviewRepository productReviewRepository;
    private final ProductRepository productRepository;

    @Override
    public ReviewResponse create(UUID buyerId, UUID productId, CreateReviewRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        int score = request.score() == null ? 0 : request.score();
        if (score < MIN_SCORE || score > MAX_SCORE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Điểm đánh giá phải nằm trong khoảng " + MIN_SCORE + ".." + MAX_SCORE);
        }
        // FR-42: mỗi đơn hàng chỉ được đánh giá sản phẩm một lần
        if (request.orderId() != null
                && productReviewRepository.existsByProductIdAndBuyerIdAndOrderId(productId, buyerId, request.orderId())) {
            throw new DuplicateResourceException("ProductReview", "orderId", request.orderId());
        }
        // TODO (business logic): FR-42 — chỉ cho phép đánh giá khi đơn hàng của Buyer đã COMPLETED;
        // cần gọi module commerce để kiểm tra ở giai đoạn sau.

        ProductReview review = ProductReview.builder()
                .productId(product.getId())
                .buyerId(buyerId)
                .orderId(request.orderId())
                .score(score)
                .comment(request.comment())
                // Đánh giá mới hiển thị ngay; Admin có thể chuyển HIDDEN khi kiểm duyệt (FR-59)
                .status(ReviewStatus.VISIBLE)
                .build();
        return ProductReviewMapper.toResponse(productReviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> listVisibleByProduct(UUID productId, Pageable pageable) {
        productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        Page<ProductReview> page =
                productReviewRepository.findByProductIdAndStatus(productId, ReviewStatus.VISIBLE, pageable);
        return PageResponse.from(page, ProductReviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> listForAdmin(ReviewStatus status, UUID productId, Pageable pageable) {
        Page<ProductReview> page;
        if (status != null && productId != null) {
            page = productReviewRepository.findByProductIdAndStatus(productId, status, pageable);
        } else if (status != null) {
            page = productReviewRepository.findByStatus(status, pageable);
        } else if (productId != null) {
            page = productReviewRepository.findByProductId(productId, pageable);
        } else {
            page = productReviewRepository.findAll(pageable);
        }
        return PageResponse.from(page, ProductReviewMapper::toResponse);
    }

    @Override
    public ReviewResponse updateStatus(UUID reviewId, UpdateReviewStatusRequest request) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductReview", reviewId));
        if (request.status() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Trạng thái đánh giá không được để trống");
        }
        review.setStatus(request.status());
        productReviewRepository.save(review);
        return ProductReviewMapper.toResponse(review);
    }
}
