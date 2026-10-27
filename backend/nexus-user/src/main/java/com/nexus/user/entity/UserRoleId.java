package com.nexus.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/**
 * Khoá ghép của bảng {@code nexus_user.user_roles}: {@code (user_id, role_id)}.
 * <p>
 * Là {@code @Embeddable} (không kế thừa {@code BaseEntity}) nên phải tự cài
 * {@code equals/hashCode} — Lombok {@code @EqualsAndHashCode} sinh đúng cho mục đích khoá JPA.
 */
@Embeddable
@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "role_id", nullable = false)
    private UUID roleId;
}
