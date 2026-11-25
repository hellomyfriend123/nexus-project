package com.nexus.catalog.repository;

import com.nexus.catalog.entity.Category;
import com.nexus.catalog.enums.CategoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Truy vấn danh mục (FR-09, FR-54).
 * Bảng {@code categories} KHÔNG có soft delete: "xoá" là chuyển {@code status = INACTIVE}.
 */
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    /** Cây danh mục công khai: chỉ lấy ACTIVE, sắp xếp theo thứ tự hiển thị (FR-09). */
    List<Category> findByStatusOrderBySortOrderAscNameAsc(CategoryStatus status);

    /** Danh sách phân trang cho Admin, lọc theo trạng thái nếu có. */
    Page<Category> findByStatus(CategoryStatus status, Pageable pageable);

    /** Kiểm tra còn danh mục con hay không (chặn xoá danh mục cha — FR-54). */
    boolean existsByParentId(UUID parentId);
}
