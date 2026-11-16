package com.nexus.fulfillment.repository;

import com.nexus.fulfillment.entity.Warehouse;
import com.nexus.fulfillment.enums.WarehouseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID>, JpaSpecificationExecutor<Warehouse> {

    Optional<Warehouse> findByCode(String code);

    boolean existsByCode(String code);

    /** Kho mặc định khi tạo SKU: kho ACTIVE đầu tiên theo mã kho. */
    Optional<Warehouse> findFirstByStatusOrderByCodeAsc(WarehouseStatus status);

    List<Warehouse> findAllByStatus(WarehouseStatus status);

    Page<Warehouse> findAllByStatus(WarehouseStatus status, Pageable pageable);
}
