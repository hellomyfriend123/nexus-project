-- =====================================================================================
-- MODULE USER — schema nexus_user
-- FR-01 (Register), FR-02 (Login/Logout + token), FR-03 (Profile), FR-04 & FR-52 (Admin quản lý user)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_user.users (
    id              UUID          PRIMARY KEY,
    email           VARCHAR(255)  NOT NULL,
    username        VARCHAR(100)  NOT NULL,
    phone           VARCHAR(20),
    full_name       VARCHAR(150)  NOT NULL,
    identity_number VARCHAR(30),
    gender          VARCHAR(20),
    address         TEXT,
    date_of_birth   DATE,
    password_hash   VARCHAR(255)  NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

-- FR-01: email/username không được trùng.
-- Dùng partial unique index (chỉ áp dụng cho bản ghi CHƯA xoá mềm) để email của user
-- đã xoá mềm không khoá vĩnh viễn không cho người khác đăng ký lại.
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_active
    ON nexus_user.users (lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_active
    ON nexus_user.users (lower(username)) WHERE deleted_at IS NULL;

-- Postgres KHÔNG tự đánh index cho khoá ngoại/cột hay lọc → thêm tay.
CREATE INDEX IF NOT EXISTS ix_users_status      ON nexus_user.users (status);
CREATE INDEX IF NOT EXISTS ix_users_created_at  ON nexus_user.users (created_at DESC);

ALTER TABLE nexus_user.users
    ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED'));
ALTER TABLE nexus_user.users
    ADD CONSTRAINT ck_users_gender CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER'));


CREATE TABLE IF NOT EXISTS nexus_user.roles (
    id          UUID         PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_code ON nexus_user.roles (code);


-- Bảng nối User ⇄ Role (khoá chính ghép). JPA ánh xạ bằng @EmbeddedId UserRoleId.
CREATE TABLE IF NOT EXISTS nexus_user.user_roles (
    user_id     UUID        NOT NULL REFERENCES nexus_user.users (id) ON DELETE CASCADE,
    role_id     UUID        NOT NULL REFERENCES nexus_user.roles (id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS ix_user_roles_role_id ON nexus_user.user_roles (role_id);
