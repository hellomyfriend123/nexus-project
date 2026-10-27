-- =====================================================================================
-- MODULE COMMERCE — schema nexus_commerce
-- FR-15..18 (Cart), FR-19..21 (Checkout & Payment), FR-22..25 (Order)
-- FR-43/44 (đánh giá Seller), FR-46..48 (Promotion), FR-56/58 (Admin)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_commerce.carts (
    id         UUID          PRIMARY KEY,
    buyer_id   UUID          NOT NULL,               -- tham chiếu logic tới nexus_user.users
    status     VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    subtotal   NUMERIC(19,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_carts_buyer_id ON nexus_commerce.carts (buyer_id);
CREATE INDEX IF NOT EXISTS ix_carts_status   ON nexus_commerce.carts (status);
-- FR-15: mỗi Buyer chỉ có MỘT cart ACTIVE
CREATE UNIQUE INDEX IF NOT EXISTS ux_carts_buyer_active
    ON nexus_commerce.carts (buyer_id) WHERE status = 'ACTIVE';
ALTER TABLE nexus_commerce.carts
    ADD CONSTRAINT ck_carts_status CHECK (status IN ('ACTIVE', 'CONVERTED', 'ABANDONED'));


CREATE TABLE IF NOT EXISTS nexus_commerce.cart_items (
    id          UUID          PRIMARY KEY,
    cart_id     UUID          NOT NULL REFERENCES nexus_commerce.carts (id) ON DELETE CASCADE,
    product_id  UUID          NOT NULL,
    sku_id      UUID,
    seller_id   UUID          NOT NULL,
    quantity    INTEGER       NOT NULL,
    unit_price  NUMERIC(19,2) NOT NULL,              -- snapshot giá tại thời điểm thêm vào giỏ
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_cart_items_cart_id ON nexus_commerce.cart_items (cart_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_items_product_sku
    ON nexus_commerce.cart_items (cart_id, product_id, COALESCE(sku_id, '00000000-0000-0000-0000-000000000000'::uuid));
ALTER TABLE nexus_commerce.cart_items
    ADD CONSTRAINT ck_cart_items_quantity_positive CHECK (quantity > 0);
ALTER TABLE nexus_commerce.cart_items
    ADD CONSTRAINT ck_cart_items_price_non_negative CHECK (unit_price >= 0);


CREATE TABLE IF NOT EXISTS nexus_commerce.orders (
    id               UUID          PRIMARY KEY,
    order_number     VARCHAR(50)   NOT NULL,
    buyer_id         UUID          NOT NULL,
    seller_id        UUID          NOT NULL,         -- MVP: mỗi order chỉ một Seller (FR-23)
    order_type       VARCHAR(20)   NOT NULL DEFAULT 'DIRECT',
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    subtotal         NUMERIC(19,2) NOT NULL DEFAULT 0,
    discount         NUMERIC(19,2) NOT NULL DEFAULT 0,
    shipping_fee     NUMERIC(19,2) NOT NULL DEFAULT 0,
    total_amount     NUMERIC(19,2) NOT NULL DEFAULT 0,
    shipping_address TEXT          NOT NULL,         -- snapshot địa chỉ tại thời điểm đặt (FR-19)
    receiver_name    VARCHAR(150),
    receiver_phone   VARCHAR(20),
    discount_code    VARCHAR(50),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_order_number ON nexus_commerce.orders (order_number);
CREATE INDEX IF NOT EXISTS ix_orders_buyer_id   ON nexus_commerce.orders (buyer_id);
CREATE INDEX IF NOT EXISTS ix_orders_seller_id  ON nexus_commerce.orders (seller_id);
CREATE INDEX IF NOT EXISTS ix_orders_status     ON nexus_commerce.orders (status);
CREATE INDEX IF NOT EXISTS ix_orders_type       ON nexus_commerce.orders (order_type);
ALTER TABLE nexus_commerce.orders
    ADD CONSTRAINT ck_orders_status
        CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'));
ALTER TABLE nexus_commerce.orders
    ADD CONSTRAINT ck_orders_type CHECK (order_type IN ('DIRECT', 'AUCTION'));


CREATE TABLE IF NOT EXISTS nexus_commerce.order_items (
    id                    UUID          PRIMARY KEY,
    order_id              UUID          NOT NULL REFERENCES nexus_commerce.orders (id) ON DELETE CASCADE,
    product_id            UUID          NOT NULL,
    sku_id                UUID,
    seller_id             UUID,
    product_name_snapshot VARCHAR(255)  NOT NULL,    -- snapshot: sản phẩm đổi tên không làm sai hoá đơn cũ
    sku_code_snapshot     VARCHAR(50),
    quantity              INTEGER       NOT NULL,
    unit_price            NUMERIC(19,2) NOT NULL,
    subtotal              NUMERIC(19,2) NOT NULL,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON nexus_commerce.order_items (order_id);
ALTER TABLE nexus_commerce.order_items
    ADD CONSTRAINT ck_order_items_quantity_positive CHECK (quantity > 0);


CREATE TABLE IF NOT EXISTS nexus_commerce.payments (
    id                UUID          PRIMARY KEY,
    order_id          UUID          NOT NULL REFERENCES nexus_commerce.orders (id) ON DELETE CASCADE,
    payment_method    VARCHAR(30)   NOT NULL DEFAULT 'MOCK',
    payment_reference VARCHAR(255),
    amount            NUMERIC(19,2) NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    idempotency_key   VARCHAR(255)  NOT NULL,        -- FR-21: chống trừ tiền 2 lần
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_payments_order_id ON nexus_commerce.payments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_idempotency_key
    ON nexus_commerce.payments (idempotency_key);
-- Một đơn chỉ được có TỐI ĐA MỘT giao dịch thành công
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_one_success_per_order
    ON nexus_commerce.payments (order_id) WHERE status = 'SUCCESS';
ALTER TABLE nexus_commerce.payments
    ADD CONSTRAINT ck_payments_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'));
ALTER TABLE nexus_commerce.payments
    ADD CONSTRAINT ck_payments_method CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'E_WALLET', 'MOCK'));


CREATE TABLE IF NOT EXISTS nexus_commerce.seller_ratings (
    id         UUID        PRIMARY KEY,
    order_id   UUID        NOT NULL,
    seller_id  UUID        NOT NULL,
    buyer_id   UUID        NOT NULL,
    score      INTEGER     NOT NULL,
    comment    TEXT,
    status     VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_seller_ratings_seller_id ON nexus_commerce.seller_ratings (seller_id);
CREATE INDEX IF NOT EXISTS ix_seller_ratings_order_id  ON nexus_commerce.seller_ratings (order_id);
ALTER TABLE nexus_commerce.seller_ratings
    ADD CONSTRAINT ck_seller_ratings_score CHECK (score BETWEEN 1 AND 5);
ALTER TABLE nexus_commerce.seller_ratings
    ADD CONSTRAINT ck_seller_ratings_status CHECK (status IN ('VISIBLE', 'HIDDEN'));


CREATE TABLE IF NOT EXISTS nexus_commerce.promotion_campaigns (
    id          UUID         PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,               -- FR-46
    description TEXT,
    start_date  DATE,
    end_date    DATE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_campaigns_status ON nexus_commerce.promotion_campaigns (status);
ALTER TABLE nexus_commerce.promotion_campaigns
    ADD CONSTRAINT ck_campaigns_status CHECK (status IN ('DRAFT', 'ACTIVE', 'ENDED'));


CREATE TABLE IF NOT EXISTS nexus_commerce.discount_codes (
    id               UUID          PRIMARY KEY,
    campaign_id      UUID          REFERENCES nexus_commerce.promotion_campaigns (id) ON DELETE SET NULL,
    code             VARCHAR(50)   NOT NULL,         -- FR-47
    discount_type    VARCHAR(20)   NOT NULL,
    discount_value   NUMERIC(19,2) NOT NULL,
    min_order_amount NUMERIC(19,2) NOT NULL DEFAULT 0,
    usage_limit      INTEGER,
    used_count       INTEGER       NOT NULL DEFAULT 0,
    start_at         TIMESTAMPTZ,
    end_at           TIMESTAMPTZ,
    status           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_discount_codes_code ON nexus_commerce.discount_codes (upper(code));
CREATE INDEX IF NOT EXISTS ix_discount_codes_campaign_id ON nexus_commerce.discount_codes (campaign_id);
CREATE INDEX IF NOT EXISTS ix_discount_codes_status      ON nexus_commerce.discount_codes (status);
ALTER TABLE nexus_commerce.discount_codes
    ADD CONSTRAINT ck_discount_codes_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT'));
ALTER TABLE nexus_commerce.discount_codes
    ADD CONSTRAINT ck_discount_codes_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE nexus_commerce.discount_codes
    ADD CONSTRAINT ck_discount_codes_value_positive CHECK (discount_value > 0);
