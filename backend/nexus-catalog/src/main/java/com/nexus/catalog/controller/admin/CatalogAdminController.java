package com.nexus.catalog.controller.admin;

import com.nexus.catalog.dto.admin.CreateCategoryRequest;
import com.nexus.catalog.dto.admin.UpdateCategoryRequest;
import com.nexus.catalog.dto.admin.UpdateProductStatusRequest;
import com.nexus.catalog.dto.admin.UpdateReviewStatusRequest;
import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.common.ProductSummaryResponse;
import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.catalog.enums.ProductStatus;
import com.nexus.catalog.enums.ReviewStatus;
import com.nexus.catalog.service.CategoryService;
import com.nexus.catalog.service.ProductReviewService;
import com.nexus.catalog.service.ProductService;
import com.nexus.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint quản trị catalog: danh mục (FR-09, FR-54), sản phẩm (FR-08, FR-53),
 * kiểm duyệt đánh giá (FR-45, FR-59).
 */
@RestController
@RequestMapping("/api/v1/admin/catalog")
@Tag(name = "Catalog — Admin", description = "FR-08, FR-09, FR-45, FR-53, FR-54, FR-59")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CatalogAdminController {

    private final CategoryService categoryService;
    private final ProductService productService;
    private final ProductReviewService productReviewService;

    // ------------------------------------------------------------------ danh mục (FR-09, FR-54)

    @GetMapping("/categories")
    @Operation(summary = "FR-09/FR-54 — Danh sách danh mục (phân trang, lọc theo trạng thái)")
    public PageResponse<CategoryResponse> listCategories(@RequestParam(required = false) CategoryStatus status,
                                                         Pageable pageable) {
        return categoryService.listForAdmin(status, pageable);
    }

    @GetMapping("/categories/{id}")
    @Operation(summary = "FR-09/FR-54 — Chi tiết danh mục")
    public CategoryResponse getCategory(@PathVariable UUID id) {
        return categoryService.getById(id);
    }

    @PostMapping("/categories")
    @Operation(summary = "FR-09/FR-54 — Tạo danh mục")
    @ApiResponse(responseCode = "201", description = "Tạo danh mục thành công")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "FR-09/FR-54 — Cập nhật danh mục (không thể đặt chính nó làm danh mục cha)")
    public CategoryResponse updateCategory(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateCategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "FR-09/FR-54 — Xoá danh mục (chuyển sang INACTIVE; chặn nếu còn sản phẩm hoạt động)")
    @ApiResponse(responseCode = "204", description = "Chuyển danh mục sang INACTIVE thành công")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------ sản phẩm (FR-08, FR-53)

    @GetMapping("/products")
    @Operation(summary = "FR-53 — Danh sách sản phẩm cho quản trị "
            + "(mặc định bỏ qua sản phẩm đã xoá mềm; đặt includeDeleted=true để xem tất cả)")
    public PageResponse<ProductSummaryResponse> listProducts(@RequestParam(required = false) String keyword,
                                                             @RequestParam(required = false) UUID categoryId,
                                                             @RequestParam(required = false) ProductStatus status,
                                                             @RequestParam(defaultValue = "false") boolean includeDeleted,
                                                             Pageable pageable) {
        return productService.adminSearch(keyword, categoryId, status, includeDeleted, pageable);
    }

    @PatchMapping("/products/{id}/status")
    @Operation(summary = "FR-53 — Đổi trạng thái sản phẩm (DRAFT / ACTIVE / INACTIVE)")
    public ProductResponse updateProductStatus(@PathVariable UUID id,
                                               @Valid @RequestBody UpdateProductStatusRequest request) {
        return productService.updateStatus(id, request);
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "FR-08 — Admin xoá mềm sản phẩm (không hard delete)")
    @ApiResponse(responseCode = "204", description = "Xoá mềm sản phẩm thành công")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteByAdmin(id);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------------ kiểm duyệt đánh giá (FR-45, FR-59)

    @GetMapping("/reviews")
    @Operation(summary = "FR-45 — Danh sách đánh giá để kiểm duyệt (lọc theo trạng thái/sản phẩm)")
    public PageResponse<ReviewResponse> listReviews(@RequestParam(required = false) ReviewStatus status,
                                                    @RequestParam(required = false) UUID productId,
                                                    Pageable pageable) {
        return productReviewService.listForAdmin(status, productId, pageable);
    }

    @PatchMapping("/reviews/{id}/status")
    @Operation(summary = "FR-59 — Kiểm duyệt đánh giá: VISIBLE / HIDDEN")
    public ReviewResponse updateReviewStatus(@PathVariable UUID id,
                                             @Valid @RequestBody UpdateReviewStatusRequest request) {
        return productReviewService.updateStatus(id, request);
    }
}
