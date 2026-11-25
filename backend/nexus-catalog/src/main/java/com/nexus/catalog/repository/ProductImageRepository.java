package com.nexus.catalog.repository;

import com.nexus.catalog.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Truy vấn ảnh sản phẩm (FR-05, FR-07).
 */
public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    /** Ảnh của một sản phẩm, sắp xếp theo thứ tự hiển thị. */
    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);

    /** Nạp ảnh của nhiều sản phẩm trong một truy vấn (tránh N+1 khi trả danh sách — FR-06/FR-11). */
    List<ProductImage> findByProductIdInOrderBySortOrderAsc(Collection<UUID> productIds);

    /**
     * Xoá toàn bộ ảnh cũ của sản phẩm trước khi ghi danh sách ảnh mới (FR-07).
     * Phải gọi bên trong một transaction (service đã có {@code @Transactional}).
     */
    void deleteByProductId(UUID productId);
}
