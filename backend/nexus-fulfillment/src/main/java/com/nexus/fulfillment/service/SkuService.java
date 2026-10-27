package com.nexus.fulfillment.service;

import com.nexus.common.api.PageResponse;
import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.dto.seller.CreateSkuRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** SKU — endpoint nội bộ phục vụ FR-05 và FR-13 (lọc tồn kho theo Seller). */
public interface SkuService {

    /**
     * Tạo SKU cho Seller đang đăng nhập và <b>đồng thời</b> tạo một bản ghi {@code Inventory}
     * ở kho ACTIVE mặc định (kho ACTIVE đầu tiên theo mã kho).
     *
     * @param sellerId lấy từ token, không nhận từ request
     */
    SkuResponse create(UUID sellerId, CreateSkuRequest request);

    /** Danh sách SKU của Seller đang đăng nhập. */
    PageResponse<SkuResponse> listBySeller(UUID sellerId, Pageable pageable);
}
