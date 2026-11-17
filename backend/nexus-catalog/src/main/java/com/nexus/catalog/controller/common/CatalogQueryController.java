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
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.common.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
 * <p>
 * <b>Khách chưa đăng nhập cũng xem được</b> (sàn TMĐT công khai sản phẩm): cả 4 endpoint GET bên dưới
 * đều {@code permitAll}. Cần khớp với {@code SecurityConfig} — ở đó cũng phải permitAll cho đúng
 * các URL này, vì filter chain và {@code @PreAuthorize} là <b>hai lớp chặn độc lập</b>: mở một lớp
 * mà quên lớp kia thì vẫn nhận 401.
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
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-06/FR-11/FR-12 — Danh sách sản phẩm: tìm theo tên, lọc danh mục/giá/trạng thái, "
            + "sắp xếp theo basePrice hoặc createdAt (mặc định createdAt giảm dần). "
            + "Chỉ trả sản phẩm chưa bị xoá mềm. Không cần đăng nhập.")
    public PageResponse<ProductSummaryResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) ProductStatus status,
            Pageable pageable) {
        // Khách chưa đăng nhập chỉ được thấy sản phẩm ACTIVE. Nếu không chặn ở đây thì
        // ?status=DRAFT (hoặc bỏ trống status, vì bộ lọc chỉ thêm điều kiện khi status != null)
        // sẽ đưa bản nháp/ngừng kinh doanh của Seller ra internet.
        ProductStatus effectiveStatus = isAuthenticated() ? status : ProductStatus.ACTIVE;
        return productService.search(keyword, categoryId, minPrice, maxPrice, effectiveStatus, pageable);
    }

    @GetMapping("/products/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-06 — Xem chi tiết sản phẩm kèm ảnh và danh mục. Không cần đăng nhập.")
    public ProductResponse getById(@PathVariable UUID id) {
        ProductResponse product = productService.getById(id);
        // Khách lạ không được biết sản phẩm DRAFT/INACTIVE có tồn tại: trả 404 như thể không có,
        // thay vì 403 (403 sẽ xác nhận "có sản phẩm này nhưng bạn không được xem").
        if (!isAuthenticated() && product.status() != ProductStatus.ACTIVE) {
            throw new ResourceNotFoundException("Product", id);
        }
        return product;
    }

    @GetMapping("/categories")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-09 — Xem cây danh mục đang hoạt động (cha + con). "
            + "Trả về dạng cây nên không phân trang. Không cần đăng nhập.")
    public List<CategoryResponse> categories() {
        return categoryService.getActiveTree();
    }

    @GetMapping("/products/{id}/reviews")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-41 — Danh sách đánh giá đang hiển thị (VISIBLE) của sản phẩm. Không cần đăng nhập.")
    public PageResponse<ReviewResponse> reviews(@PathVariable UUID id, Pageable pageable) {
        return productReviewService.listVisibleByProduct(id, pageable);
    }

    /**
     * Người gọi đã đăng nhập hay chưa.
     * <p>
     * Dùng {@link CurrentUser} làm dấu hiệu, giống {@code SecurityUtils}, vì {@code TokenAuthenticationFilter}
     * chỉ đặt principal khi token hợp lệ. Không ném lỗi như {@code SecurityUtils.currentUser()}
     * — ở đây "chưa đăng nhập" là trạng thái hợp lệ.
     */
    private static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof CurrentUser;
    }
}
