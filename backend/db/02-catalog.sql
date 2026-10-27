-- =====================================================================================
-- MODULE CATALOG — schema nexus_catalog
-- FR-05..08 (Product CRUD), FR-09/10 (Category + assign), FR-11/12 (Search/Filter/Sort)
-- FR-41/42/45 (Review sản phẩm + kiểm duyệt), FR-53/54 (Admin), FR-59 (Moderate review)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_catalog.categories (
    id          UUID         PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    parent_id   UUID         REFERENCES nexus_catalog.categories (id) ON DELETE SET NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    sort_order  INTEGER      DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_categories_parent_id ON nexus_catalog.categories (parent_id);
CREATE INDEX IF NOT EXISTS ix_categories_status    ON nexus_catalog.categories (status);
ALTER TABLE nexus_catalog.categories
    ADD CONSTRAINT ck_categories_status CHECK (status IN ('ACTIVE', 'INACTIVE'));


CREATE TABLE IF NOT EXISTS nexus_catalog.products (
    id          UUID          PRIMARY KEY,
    seller_id   UUID          NOT NULL,              -- tham chiếu logic tới nexus_user.users
    category_id UUID          REFERENCES nexus_catalog.categories (id) ON DELETE SET NULL,
    name        VARCHAR(255)  NOT NULL,
    description TEXT,
    base_price  NUMERIC(19,2) NOT NULL,              -- FR-05: giá nằm ở Product
    status      VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    deleted_at  TIMESTAMPTZ,                         -- FR-08: soft delete
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_products_seller_id   ON nexus_catalog.products (seller_id);
CREATE INDEX IF NOT EXISTS ix_products_category_id ON nexus_catalog.products (category_id);
CREATE INDEX IF NOT EXISTS ix_products_status      ON nexus_catalog.products (status);
-- FR-12: sort theo giá / mới nhất
CREATE INDEX IF NOT EXISTS ix_products_base_price  ON nexus_catalog.products (base_price);
CREATE INDEX IF NOT EXISTS ix_products_created_at  ON nexus_catalog.products (created_at DESC);
-- FR-11: tìm theo tên (không phân biệt hoa thường) trên sản phẩm chưa xoá
CREATE INDEX IF NOT EXISTS ix_products_name_lower
    ON nexus_catalog.products (lower(name)) WHERE deleted_at IS NULL;

ALTER TABLE nexus_catalog.products
    ADD CONSTRAINT ck_products_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE'));
ALTER TABLE nexus_catalog.products
    ADD CONSTRAINT ck_products_base_price CHECK (base_price > 0);


CREATE TABLE IF NOT EXISTS nexus_catalog.product_images (
    id         UUID         PRIMARY KEY,
    product_id UUID         NOT NULL REFERENCES nexus_catalog.products (id) ON DELETE CASCADE,
    image_url  VARCHAR(500) NOT NULL,                -- FR-05: chỉ lưu URL, chưa upload file thật
    is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order INTEGER      DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_product_images_product_id ON nexus_catalog.product_images (product_id);


CREATE TABLE IF NOT EXISTS nexus_catalog.product_reviews (
    id         UUID        PRIMARY KEY,
    product_id UUID        NOT NULL REFERENCES nexus_catalog.products (id) ON DELETE CASCADE,
    buyer_id   UUID        NOT NULL,                 -- tham chiếu logic tới nexus_user.users
    order_id   UUID,                                 -- tham chiếu logic tới nexus_commerce.orders (chứng minh đã mua)
    score      INTEGER     NOT NULL,                 -- FR-41: 1..5
    comment    TEXT,
    status     VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_product_reviews_product_id ON nexus_catalog.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS ix_product_reviews_buyer_id   ON nexus_catalog.product_reviews (buyer_id);
CREATE INDEX IF NOT EXISTS ix_product_reviews_status     ON nexus_catalog.product_reviews (status);
ALTER TABLE nexus_catalog.product_reviews
    ADD CONSTRAINT ck_product_reviews_score CHECK (score BETWEEN 1 AND 5);
ALTER TABLE nexus_catalog.product_reviews
    ADD CONSTRAINT ck_product_reviews_status CHECK (status IN ('VISIBLE', 'HIDDEN'));
