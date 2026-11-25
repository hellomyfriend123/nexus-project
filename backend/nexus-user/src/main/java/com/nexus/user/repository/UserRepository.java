package com.nexus.user.repository;

import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.entity.UserRoleId;
import com.nexus.user.enums.UserStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn người dùng — bảng {@code nexus_user.users}.
 * <p>
 * Mọi truy vấn đều lọc soft delete ({@code deletedAt IS NULL}) theo §8 CONVENTIONS.
 * Không có truy vấn native nào.
 */
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    boolean existsByUsernameAndDeletedAtIsNull(String username);

    /**
     * Bộ lọc động cho FR-04/FR-52 — {@code GET /api/v1/admin/users}.
     * <p>
     * Tham số nào null/rỗng thì bỏ qua điều kiện đó:
     * <ul>
     *   <li>{@code keyword}: tìm gần đúng (không phân biệt hoa thường) trên email/username/full_name;</li>
     *   <li>{@code status}: lọc đúng trạng thái tài khoản;</li>
     *   <li>{@code roleCode}: lọc theo vai trò — dùng subquery trên {@code user_roles} vì
     *       {@code User} cố tình không có {@code @OneToMany} tới {@code UserRole}
     *       (subquery vẫn nằm trong cùng schema/module nên không vi phạm ranh giới module).</li>
     * </ul>
     * Ghi chú: Spring Data JPA luôn truyền {@code CriteriaQuery} khác null khi gọi
     * {@code findAll(Specification, Pageable)} (kể cả query đếm) nên dùng {@code query.subquery(...)} an toàn.
     */
    static Specification<User> filter(String keyword, UserStatus status, String roleCode) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(root.get("fullName")), pattern)));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(roleCode)) {
                Subquery<UUID> subquery = query.subquery(UUID.class);
                Root<UserRole> userRoleRoot = subquery.from(UserRole.class);
                Join<UserRole, Role> roleJoin = userRoleRoot.join("role");
                subquery.select(userRoleRoot.<UserRoleId>get("id").<UUID>get("userId"))
                        .where(cb.equal(roleJoin.get("code"), roleCode.trim().toUpperCase(Locale.ROOT)));
                predicates.add(root.get("id").in(subquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
