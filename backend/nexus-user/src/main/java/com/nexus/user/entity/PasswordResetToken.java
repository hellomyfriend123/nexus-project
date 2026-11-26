package com.nexus.user.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Mã đặt lại mật khẩu (quên mật khẩu) — bảng {@code nexus_user.password_reset_tokens}.
 * <p>
 * Nguyên tắc bảo mật:
 * <ul>
 *   <li><b>KHÔNG</b> lưu mã thô: chỉ lưu {@code SHA-256(mã)} dạng hex. Lộ bảng cũng không dùng lại
 *       được mã (kẻ tấn công không đảo ngược được hash của một giá trị 256-bit ngẫu nhiên).</li>
 *   <li>Mã chỉ dùng <b>một lần</b> — sau khi đổi mật khẩu thành công, {@code usedAt} được ghi và
 *       mọi mã còn sống của người dùng bị vô hiệu hoá.</li>
 *   <li>Mã có <b>hạn dùng</b> ngắn ({@code expiresAt}, mặc định 15 phút).</li>
 * </ul>
 * {@code userId} là UUID trần (không {@code @ManyToOne}) để không phụ thuộc lazy-loading và
 * tránh vòng tham chiếu khi map response.
 */
@Entity
@Table(name = "password_reset_tokens", schema = "nexus_user")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken extends BaseEntity {

    /** Người dùng sở hữu mã — UUID trần, không join sang entity khác. */
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** {@code SHA-256(mã thô)} dạng hex 64 ký tự — KHÔNG bao giờ trả ra REST. */
    @Column(name = "token_hash", nullable = false, updatable = false, length = 64)
    private String tokenHash;

    /** Thời điểm mã hết hiệu lực. */
    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    /** Khác null nghĩa là mã đã được dùng (hoặc đã bị vô hiệu hoá) — không dùng lại được. */
    @Column(name = "used_at")
    private Instant usedAt;
}
