package com.nexus.user.repository;

import com.nexus.user.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy vấn mã đặt lại mật khẩu — bảng {@code nexus_user.password_reset_tokens}.
 * <p>
 * Tra cứu luôn theo {@code tokenHash} (không theo mã thô): mã thô chỉ tồn tại ở client,
 * server không giữ bản rõ.
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /** Tìm mã còn hiệu lực để đổi mật khẩu — đã dùng thì coi như không tồn tại. */
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    /**
     * Vô hiệu hoá toàn bộ mã còn sống của một người dùng trong MỘT câu UPDATE.
     * <p>
     * Dùng khi: (1) người dùng yêu cầu mã mới → mã cũ phải chết ngay; (2) đổi mật khẩu thành công
     * → mọi link đặt lại còn treo đều vô hiệu.
     *
     * @return số bản ghi đã cập nhật
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update PasswordResetToken t set t.usedAt = :usedAt "
            + "where t.userId = :userId and t.usedAt is null")
    int markAllUsedByUserId(@Param("userId") UUID userId, @Param("usedAt") Instant usedAt);

    /**
     * Dọn mã đã hết hạn để bảng không phình mãi.
     * <p>
     * Bảng này KHÔNG phải bản ghi nghiệp vụ (không phục vụ tra cứu/audit) nên xoá cứng là hợp lý —
     * khác với quy tắc soft delete áp cho Order/Payment/User.
     *
     * @return số bản ghi đã xoá
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from PasswordResetToken t where t.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}
