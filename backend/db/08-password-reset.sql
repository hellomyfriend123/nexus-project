-- =====================================================================================
-- MODULE USER — bảng mã đặt lại mật khẩu (quên mật khẩu, bổ sung cho FR-02)
--
-- Luồng: POST /api/v1/auth/forgot-password  -> phát mã dùng một lần
--        POST /api/v1/auth/reset-password   -> đổi mật khẩu bằng mã
--
-- Server KHÔNG lưu mã thô: chỉ lưu SHA-256(mã) dạng hex 64 ký tự. Lộ bảng cũng không
-- tái sử dụng được mã vì không thể đảo ngược hash của một giá trị 256-bit ngẫu nhiên.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_user.password_reset_tokens (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES nexus_user.users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tra cứu khi đổi mật khẩu luôn theo token_hash -> phải unique + có index.
CREATE UNIQUE INDEX IF NOT EXISTS ux_password_reset_tokens_token_hash
    ON nexus_user.password_reset_tokens (token_hash);

-- Vô hiệu hoá toàn bộ mã của một người dùng (khi phát mã mới / sau khi đổi thành công).
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id
    ON nexus_user.password_reset_tokens (user_id);

-- Dọn mã hết hạn.
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_expires_at
    ON nexus_user.password_reset_tokens (expires_at);
