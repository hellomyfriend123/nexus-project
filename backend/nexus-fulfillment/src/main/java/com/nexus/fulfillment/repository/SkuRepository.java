package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Sku;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SkuRepository extends JpaRepository<Sku, UUID>, JpaSpecificationExecutor<Sku> {

    @Query(value = "SELECT nextval('nexus_fulfillment.sku_code_seq')", nativeQuery = true)
    long nextSkuCodeValue();

    /** Danh sách SKU của một Seller (FR-13 lọc theo Seller đang đăng nhập). */
    Page<Sku> findAllBySellerId(UUID sellerId, Pageable pageable);
}
