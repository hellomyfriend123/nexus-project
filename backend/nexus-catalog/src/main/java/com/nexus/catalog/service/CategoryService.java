package com.nexus.catalog.service;

import com.nexus.catalog.dto.admin.CreateCategoryRequest;
import com.nexus.catalog.dto.admin.UpdateCategoryRequest;
import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Nghiệp vụ danh mục — FR-09, FR-54.
 */
public interface CategoryService {

    /**
     * FR-09 — Cây danh mục đang hoạt động (cha + con) cho mọi vai trò đã đăng nhập.
     * Trả về danh sách dạng cây nên KHÔNG phân trang.
     */
    List<CategoryResponse> getActiveTree();

    /** FR-09, FR-54 — Danh sách danh mục cho Admin (phân trang, lọc theo trạng thái nếu có). */
    PageResponse<CategoryResponse> listForAdmin(CategoryStatus status, Pageable pageable);

    /** FR-09, FR-54 — Chi tiết một danh mục. */
    CategoryResponse getById(UUID categoryId);

    /** FR-09, FR-54 — Tạo danh mục. */
    CategoryResponse create(CreateCategoryRequest request);

    /** FR-09, FR-54 — Cập nhật danh mục (chặn đặt chính nó làm cha, chặn tạo vòng lặp). */
    CategoryResponse update(UUID categoryId, UpdateCategoryRequest request);

    /**
     * FR-09, FR-54 — "Xoá" danh mục = chuyển sang {@code INACTIVE} (không hard delete).
     * Chặn khi danh mục còn sản phẩm đang hoạt động hoặc còn danh mục con.
     */
    void deactivate(UUID categoryId);
}
