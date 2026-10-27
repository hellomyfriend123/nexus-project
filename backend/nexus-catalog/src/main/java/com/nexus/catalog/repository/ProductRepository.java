package com.nexus.catalog.repository;

import com.nexus.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn sản phẩm (FR-05..FR-12, FR-53).
 * <p>
 * Quy ước: mọi truy vấn theo id đều lọc {@code deleted_at IS NULL}; danh sách động dùng
 * {@link JpaSpecificationExecutor} + {@code ProductSpecification} (có tham số includeDeleted
 * riêng cho màn quản trị).
 */
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    /** Sản phẩm chưa bị xoá mềm — dùng cho mọi thao tác đọc/sửa/xoá của Seller và Admin. */
    Optional<Product> findByIdAndDeletedAtIsNull(UUID id);

    /** Phục vụ kiểm tra "danh mục còn sản phẩm đang hoạt động hay không" trước khi xoá danh mục (FR-54). */
    boolean existsByCategoryIdAndDeletedAtIsNull(UUID categoryId);
}
