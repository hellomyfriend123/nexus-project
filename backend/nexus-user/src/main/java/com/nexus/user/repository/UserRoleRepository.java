package com.nexus.user.repository;

import com.nexus.user.entity.UserRole;
import com.nexus.user.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Truy vấn bảng nối {@code nexus_user.user_roles} — nguồn duy nhất để biết vai trò của người dùng.
 * <p>
 * Tất cả truy vấn ở đây là JPQL (không native) vì {@code User} và {@code Role} cùng module.
 */
public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

    /** Danh sách mã vai trò của một người dùng, dùng để nhét vào token (FR-02). */
    @Query("select r.code from UserRole ur join ur.role r where ur.id.userId = :userId order by r.code")
    List<String> findRoleCodesByUserId(@Param("userId") UUID userId);

    /**
     * Lấy bản gán kèm sẵn vai trò ({@code join fetch}) cho nhiều người dùng một lượt
     * — tránh N+1 khi Admin xem danh sách người dùng (FR-04/FR-52).
     */
    @Query("select ur from UserRole ur join fetch ur.role where ur.id.userId in :userIds")
    List<UserRole> findAllWithRoleByUserIds(@Param("userIds") Collection<UUID> userIds);

    /** Đếm số bản gán ứng với một vai trò cụ thể — dùng để kiểm tra quyền. */
    @Query("select count(ur) from UserRole ur where ur.id.userId = :userId and ur.role.code = :roleCode")
    long countByUserIdAndRoleCode(@Param("userId") UUID userId, @Param("roleCode") String roleCode);
}
