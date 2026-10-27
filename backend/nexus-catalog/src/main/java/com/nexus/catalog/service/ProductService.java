package com.nexus.catalog.service;

import com.nexus.catalog.dto.admin.UpdateProductStatusRequest;
import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.common.ProductSummaryResponse;
import com.nexus.catalog.dto.seller.AssignCategoryRequest;
import com.nexus.catalog.dto.seller.CreateProductRequest;
import com.nexus.catalog.dto.seller.UpdateProductRequest;
import com.nexus.catalog.enums.ProductStatus;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Nghiệp vụ sản phẩm — FR-05, FR-06, FR-07, FR-08, FR-10, FR-11, FR-12, FR-53.
 * <p>
 * Người dùng hiện tại (<code>sellerId</code>) luôn được truyền từ controller lấy qua
 * {@code SecurityUtils.currentUserId()}, KHÔNG nhận từ request body.
 */
public interface ProductService {

    /** FR-05 — Seller tạo sản phẩm. */
    ProductResponse create(UUID sellerId, CreateProductRequest request);

    /** FR-07 — Seller cập nhật sản phẩm của chính mình; không phải chủ sở hữu → 403. */
    ProductResponse update(UUID sellerId, UUID productId, UpdateProductRequest request);

    /** FR-08 — Seller xoá mềm sản phẩm của chính mình. */
    void delete(UUID sellerId, UUID productId);

    /** FR-08 — Admin xoá mềm sản phẩm bất kỳ (không cần kiểm tra chủ sở hữu). */
    void deleteByAdmin(UUID productId);

    /** FR-10 — Seller gán/đổi danh mục cho sản phẩm của chính mình. */
    ProductResponse assignCategory(UUID sellerId, UUID productId, AssignCategoryRequest request);

    /** FR-06, FR-11, FR-12 — Tìm kiếm/lọc/sắp xếp danh sách sản phẩm chưa xoá mềm (mọi vai trò đã đăng nhập). */
    PageResponse<ProductSummaryResponse> search(String keyword, UUID categoryId, BigDecimal minPrice,
                                                BigDecimal maxPrice, ProductStatus status, Pageable pageable);

    /** FR-06 — Chi tiết sản phẩm kèm ảnh, danh mục. */
    ProductResponse getById(UUID productId);

    /** FR-53 — Admin xem danh sách sản phẩm (có thể gồm cả sản phẩm đã xoá mềm). */
    PageResponse<ProductSummaryResponse> adminSearch(String keyword, UUID categoryId, ProductStatus status,
                                                     boolean includeDeleted, Pageable pageable);

    /** FR-53 — Admin đổi trạng thái sản phẩm (DRAFT / ACTIVE / INACTIVE). */
    ProductResponse updateStatus(UUID productId, UpdateProductStatusRequest request);
}
