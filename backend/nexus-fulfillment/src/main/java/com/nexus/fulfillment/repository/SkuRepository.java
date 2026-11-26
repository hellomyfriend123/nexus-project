package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Sku;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SkuRepository extends JpaRepository<Sku, UUID>, JpaSpecificationExecutor<Sku> {

    boolean existsBySkuCode(String skuCode);

    /** Danh sách SKU của một Seller (FR-13 lọc theo Seller đang đăng nhập). */
    Page<Sku> findAllBySellerId(UUID sellerId, Pageable pageable);

    /**
     * Các mã SKU hiện có bắt đầu bằng {@code prefix} — dùng để sinh số thứ tự kế tiếp.
     * <p>
     * Chỉ lấy đúng cột {@code sku_code} (không nạp entity) vì đây là truy vấn phục vụ sinh mã.
     * Số lượng mã cùng tiền tố là nhỏ (mỗi lần tạo SKU chỉ cần số lớn nhất).
     */
    @Query("select s.skuCode from Sku s where s.skuCode like concat(:prefix, '%')")
    List<String> findSkuCodesStartingWith(@Param("prefix") String prefix);
}
