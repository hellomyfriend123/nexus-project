package com.nexus.catalog.specification;

import com.nexus.catalog.entity.Product;
import com.nexus.catalog.enums.ProductStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

/**
 * Bộ lọc động cho sản phẩm (FR-06, FR-11, FR-12, FR-53) — dùng cùng
 * {@code JpaSpecificationExecutor}.
 * <p>
 * Mặc định MỌI truy vấn đều lọc {@code deleted_at IS NULL}; chỉ màn quản trị mới có thể
 * yêu cầu gồm cả sản phẩm đã xoá mềm bằng {@code includeDeleted = true}.
 */
public final class ProductSpecification {

    /** Ký tự escape cho LIKE, tránh người dùng nhập '%' hoặc '_' làm sai kết quả tìm kiếm. */
    private static final char LIKE_ESCAPE = '\\';

    private ProductSpecification() {
    }

    /** Bộ lọc mặc định: chỉ sản phẩm chưa xoá mềm. */
    public static Specification<Product> filter(String keyword, UUID categoryId, BigDecimal minPrice,
                                                BigDecimal maxPrice, ProductStatus status) {
        return filter(keyword, categoryId, minPrice, maxPrice, status, false);
    }

    /**
     * Bộ lọc đầy đủ. Tham số null/rỗng được bỏ qua (không tạo điều kiện).
     *
     * @param includeDeleted true = gồm cả sản phẩm đã xoá mềm (chỉ dùng cho Admin — FR-53)
     */
    public static Specification<Product> filter(String keyword, UUID categoryId, BigDecimal minPrice,
                                                BigDecimal maxPrice, ProductStatus status, boolean includeDeleted) {
        Specification<Product> specification = includeDeleted ? all() : notDeleted();
        if (StringUtils.hasText(keyword)) {
            specification = specification.and(nameContains(keyword));
        }
        if (categoryId != null) {
            specification = specification.and(hasCategory(categoryId));
        }
        if (minPrice != null) {
            specification = specification.and(priceAtLeast(minPrice));
        }
        if (maxPrice != null) {
            specification = specification.and(priceAtMost(maxPrice));
        }
        if (status != null) {
            specification = specification.and(hasStatus(status));
        }
        return specification;
    }

    /** Điều kiện "không bao giờ lọc gì" — thay cho {@code Specification.where(null)} đã bị deprecated. */
    public static Specification<Product> all() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
    }

    /** Chỉ sản phẩm chưa bị xoá mềm (FR-08). */
    public static Specification<Product> notDeleted() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isNull(root.get("deletedAt"));
    }

    /** Tìm theo tên, không phân biệt hoa/thường (FR-11). */
    public static Specification<Product> nameContains(String keyword) {
        String pattern = "%" + escapeLike(keyword.trim().toLowerCase(Locale.ROOT)) + "%";
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(root.get("name").as(String.class)), pattern, LIKE_ESCAPE);
    }

    public static Specification<Product> hasCategory(UUID categoryId) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("categoryId"), categoryId);
    }

    public static Specification<Product> priceAtLeast(BigDecimal minPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice").as(BigDecimal.class), minPrice);
    }

    public static Specification<Product> priceAtMost(BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(root.get("basePrice").as(BigDecimal.class), maxPrice);
    }

    public static Specification<Product> hasStatus(ProductStatus status) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }

    private static String escapeLike(String input) {
        return input.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
