package com.nexus.commerce.service.impl;

import com.nexus.commerce.dto.buyer.CreateSellerRatingRequest;
import com.nexus.commerce.dto.buyer.SellerRatingResponse;
import com.nexus.commerce.entity.Order;
import com.nexus.commerce.entity.SellerRating;
import com.nexus.commerce.enums.OrderStatus;
import com.nexus.commerce.enums.RatingStatus;
import com.nexus.commerce.mapper.SellerRatingMapper;
import com.nexus.commerce.repository.OrderRepository;
import com.nexus.commerce.repository.SellerRatingRepository;
import com.nexus.commerce.service.SellerRatingService;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Cài đặt đánh giá Seller — FR-43 (Buyer đánh giá) và FR-44 (điểm 1..5 + nhận xét).
 *
 * <p><b>Điều kiện nghiệp vụ (kiểm tra ngay ở giai đoạn CRUD, không cần module khác):</b></p>
 * <ol>
 *     <li>Đơn phải tồn tại và thuộc chính Buyer đang đăng nhập → nếu không, 403/404.</li>
 *     <li>Đơn phải ở trạng thái {@code COMPLETED} → nếu không, {@code BusinessException}.</li>
 *     <li>{@code sellerId} gửi lên phải trùng Seller của đơn → nếu không, {@code BusinessException}
 *         (chống đánh giá sai người bán).</li>
 *     <li>Mỗi Buyer chỉ đánh giá một Seller một lần cho mỗi đơn → trùng thì 409.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SellerRatingServiceImpl implements SellerRatingService {

    private final SellerRatingRepository sellerRatingRepository;
    private final OrderRepository orderRepository;

    @Override
    public SellerRatingResponse createRating(UUID buyerId, CreateSellerRatingRequest request) {
        if (request == null) {
            throw new BusinessException("Thiếu dữ liệu đánh giá Seller");
        }
        if (request.score() == null || request.score() < 1 || request.score() > 5) {
            throw new BusinessException("Điểm đánh giá phải nằm trong khoảng 1 đến 5");
        }
        if (request.orderId() == null || request.sellerId() == null) {
            throw new BusinessException("Thiếu orderId hoặc sellerId của đánh giá");
        }

        Order order = orderRepository.findByIdAndBuyerId(request.orderId(), buyerId).orElseGet(() -> {
            if (orderRepository.existsById(request.orderId())) {
                throw new ForbiddenOperationException("Đơn hàng không thuộc về Buyer đang đăng nhập");
            }
            throw new ResourceNotFoundException("Đơn hàng", request.orderId());
        });

        // FR-43: chỉ đánh giá được sau khi đơn đã hoàn tất.
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new BusinessException("Chỉ được đánh giá Seller khi đơn hàng đã ở trạng thái COMPLETED. "
                    + "Đơn hiện tại: " + order.getStatus());
        }
        if (!order.getSellerId().equals(request.sellerId())) {
            throw new BusinessException("sellerId không khớp với Seller của đơn hàng");
        }
        if (sellerRatingRepository.existsByOrderIdAndSellerIdAndBuyerId(
                order.getId(), request.sellerId(), buyerId)) {
            throw new DuplicateResourceException("Đánh giá Seller", "orderId", order.getId());
        }

        SellerRating rating = SellerRating.builder()
                .orderId(order.getId())
                .sellerId(request.sellerId())
                .buyerId(buyerId)
                .score(request.score())
                .comment(request.comment())
                .status(RatingStatus.VISIBLE)
                .build();

        return SellerRatingMapper.toResponse(sellerRatingRepository.save(rating));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SellerRatingResponse> listSellerRatings(UUID sellerId, Pageable pageable) {
        Page<SellerRating> page = sellerRatingRepository.findAllBySellerId(sellerId, pageable);
        return PageResponse.from(page, SellerRatingMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SellerRatingResponse> listBuyerRatings(UUID buyerId, Pageable pageable) {
        Page<SellerRating> page = sellerRatingRepository.findAllByBuyerId(buyerId, pageable);
        return PageResponse.from(page, SellerRatingMapper::toResponse);
    }
}
