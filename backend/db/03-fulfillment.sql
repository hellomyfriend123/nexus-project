-- =====================================================================================
-- MODULE FULFILLMENT — schema nexus_fulfillment
-- FR-13/14 (tồn kho cấp SKU), FR-38/39/40 (Shipment), FR-55 (Admin giám sát tồn kho)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_fulfillment.warehouses (
    id         UUID         PRIMARY KEY,
    code       VARCHAR(50)  NOT NULL,
    name       VARCHAR(150) NOT NULL,
    address    TEXT,
    status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_warehouses_code ON nexus_fulfillment.warehouses (code);
ALTER TABLE nexus_fulfillment.warehouses
    ADD CONSTRAINT ck_warehouses_status CHECK (status IN ('ACTIVE', 'INACTIVE'));


-- SKU thuộc về một Product (tham chiếu logic sang nexus_catalog.products).
-- seller_id được lưu kèm (denormalized) để FR-13 lọc được tồn kho theo Seller mà
-- không phải gọi sang module catalog. Nguồn sự thật của seller vẫn là Product.
CREATE TABLE IF NOT EXISTS nexus_fulfillment.skus (
    id         UUID          PRIMARY KEY,
    product_id UUID          NOT NULL,
    seller_id  UUID          NOT NULL,
    sku_code   VARCHAR(50)   NOT NULL,
    name       VARCHAR(255),
    price      NUMERIC(19,2),                        -- để trống nếu dùng base_price của Product
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_skus_sku_code   ON nexus_fulfillment.skus (sku_code);
CREATE INDEX IF NOT EXISTS ix_skus_product_id        ON nexus_fulfillment.skus (product_id);
CREATE INDEX IF NOT EXISTS ix_skus_seller_id         ON nexus_fulfillment.skus (seller_id);


CREATE TABLE IF NOT EXISTS nexus_fulfillment.inventories (
    id                UUID        PRIMARY KEY,
    sku_id            UUID        NOT NULL REFERENCES nexus_fulfillment.skus (id) ON DELETE CASCADE,
    warehouse_id      UUID        NOT NULL REFERENCES nexus_fulfillment.warehouses (id),
    total_quantity    INTEGER     NOT NULL DEFAULT 0,
    available_quantity INTEGER    NOT NULL DEFAULT 0,
    status            VARCHAR(20) NOT NULL DEFAULT 'OUT_OF_STOCK',
    version           BIGINT      NOT NULL DEFAULT 0,   -- @Version: chống đua khi trừ kho
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventories_sku_warehouse
    ON nexus_fulfillment.inventories (sku_id, warehouse_id);
CREATE INDEX IF NOT EXISTS ix_inventories_sku_id       ON nexus_fulfillment.inventories (sku_id);
CREATE INDEX IF NOT EXISTS ix_inventories_warehouse_id ON nexus_fulfillment.inventories (warehouse_id);
CREATE INDEX IF NOT EXISTS ix_inventories_status       ON nexus_fulfillment.inventories (status);

-- FR-14: hệ thống KHÔNG cho phép số lượng âm → ràng buộc ở tầng DB, không chỉ ở tầng code
ALTER TABLE nexus_fulfillment.inventories
    ADD CONSTRAINT ck_inventories_total_non_negative     CHECK (total_quantity >= 0);
ALTER TABLE nexus_fulfillment.inventories
    ADD CONSTRAINT ck_inventories_available_non_negative CHECK (available_quantity >= 0);
ALTER TABLE nexus_fulfillment.inventories
    ADD CONSTRAINT ck_inventories_status
        CHECK (status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'));


CREATE TABLE IF NOT EXISTS nexus_fulfillment.shipments (
    id              UUID         PRIMARY KEY,
    order_id        UUID         NOT NULL,           -- tham chiếu logic tới nexus_commerce.orders
    warehouse_id    UUID         REFERENCES nexus_fulfillment.warehouses (id),
    seller_id       UUID,
    tracking_number VARCHAR(100),                    -- FR-40: nhập tay, KHÔNG tích hợp carrier thật
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_shipments_order_id  ON nexus_fulfillment.shipments (order_id);
CREATE INDEX IF NOT EXISTS ix_shipments_seller_id ON nexus_fulfillment.shipments (seller_id);
CREATE INDEX IF NOT EXISTS ix_shipments_status    ON nexus_fulfillment.shipments (status);
ALTER TABLE nexus_fulfillment.shipments
    ADD CONSTRAINT ck_shipments_status CHECK (status IN ('PENDING', 'SHIPPED', 'DELIVERED'));
