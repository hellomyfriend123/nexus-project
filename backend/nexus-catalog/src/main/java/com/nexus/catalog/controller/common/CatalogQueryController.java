package com.nexus.catalog.controller.common;

import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.common.ProductSummaryResponse;
import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.enums.ProductStatus;
import com.nexus.catalog.service.CategoryService;
import com.nexus.catalog.service.ProductReviewService;
import com.nexus.catalog.service.ProductService;
import com.nexus.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Endpoint tra cứu catalog dùng cho MỌI vai trò đã đăng nhập (Buyer, Seller, Admin).
 * Vì FR-06 ghi nhiều actor nên endpoint được đặt ở {@code controller/common/} và không nhân bản theo role (§3).
 */
@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Catalog — Tra cứu", description = "FR-06, FR-09 (xem), FR-11, FR-12, FR-41 (xem)")
@RequiredArgsConstructor
public class CatalogQueryController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final ProductReviewService productReviewService;

    @GetMapping("/products")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-06/FR-11/FR-12 — Danh sách sản phẩm: tìm theo tên, lọc danh mục/giá/trạng thái, "
            + "sắp xếp theo basePrice hoặc createdAt (mặc định createdAt giảm dần). "
            + "Chỉ trả sản phẩm chưa bị xoá mềm.")
    public PageResponse<ProductSummaryResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ProductStatus status,
            Pageable pageable) {
        return productService.search(keyword, categoryId, minPrice, maxPrice, status, pageable);
    }

    @GetMapping("/products/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-06 — Xem chi tiết sản phẩm kèm ảnh và danh mục")
    public ProductResponse getById(@PathVariable UUID id) {
        return productService.getById(id);
    }

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-09 — Xem cây danh mục đang hoạt động (cha + con). "
            + "Trả về dạng cây nên không phân trang.")
    public List<CategoryResponse> categories() {
        return categoryService.getActiveTree();
    }

    @GetMapping("/products/{id}/reviews")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-41 — Danh sách đánh giá đang hiển thị (VISIBLE) của sản phẩm")
    public PageResponse<ReviewResponse> reviews(@PathVariable UUID id, Pageable pageable) {
        return productReviewService.listVisibleByProduct(id, pageable);
    }
}
