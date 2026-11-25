package com.nexus.user.repository;

import com.nexus.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn vai trò — bảng {@code nexus_user.roles} (dữ liệu cấu hình, không có soft delete).
 */
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByCode(String code);

    boolean existsByCode(String code);

    List<Role> findAllByCodeIn(Collection<String> codes);
}
