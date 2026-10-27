-- =====================================================================================
-- MODULE AUCTION — schema nexus_auction
-- FR-26/27 (Seller tạo & cấu hình), FR-28/29 (xem & danh sách), FR-30 (place bid),
-- FR-31 (bid history), FR-32 (outbid — xử lý ở tầng service), FR-33/34 (scheduler),
-- FR-35 (xác định winner), FR-36 (tạo order AUCTION — giai đoạn sau), FR-37 (cancel), FR-57 (Admin)
--
-- LƯU Ý: KHÔNG có bảng AuctionRegistration, KHÔNG có bid_increment, KHÔNG anti-sniping, KHÔNG đặt cọc.
-- Baseline 59 FR (scope.xlsx) không yêu cầu những phần đó.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_auction.auctions (
    id                UUID          PRIMARY KEY,
    product_id        UUID          NOT NULL,        -- tham chiếu logic tới nexus_catalog.products
    seller_id         UUID          NOT NULL,
    starting_price    NUMERIC(19,2) NOT NULL,
    current_price     NUMERIC(19,2) NOT NULL,        -- FR-28: giá cao nhất hiện tại
    highest_bidder_id UUID,
    start_time        TIMESTAMPTZ   NOT NULL,
    end_time          TIMESTAMPTZ   NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'SCHEDULED',
    version           BIGINT        NOT NULL DEFAULT 0,  -- @Version: chống 2 người đặt giá cùng lúc
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_auctions_product_id ON nexus_auction.auctions (product_id);
CREATE INDEX IF NOT EXISTS ix_auctions_seller_id  ON nexus_auction.auctions (seller_id);
CREATE INDEX IF NOT EXISTS ix_auctions_status     ON nexus_auction.auctions (status);
-- FR-33/34: scheduler quét theo thời gian
CREATE INDEX IF NOT EXISTS ix_auctions_status_start_time ON nexus_auction.auctions (status, start_time);
CREATE INDEX IF NOT EXISTS ix_auctions_status_end_time   ON nexus_auction.auctions (status, end_time);

ALTER TABLE nexus_auction.auctions
    ADD CONSTRAINT ck_auctions_status CHECK (status IN ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'));
ALTER TABLE nexus_auction.auctions
    ADD CONSTRAINT ck_auctions_time_order CHECK (end_time > start_time);
ALTER TABLE nexus_auction.auctions
    ADD CONSTRAINT ck_auctions_price_positive CHECK (starting_price > 0 AND current_price > 0);


CREATE TABLE IF NOT EXISTS nexus_auction.bids (
    id         UUID          PRIMARY KEY,
    auction_id UUID          NOT NULL REFERENCES nexus_auction.auctions (id) ON DELETE CASCADE,
    bidder_id  UUID          NOT NULL,
    amount     NUMERIC(19,2) NOT NULL,
    status     VARCHAR(20)   NOT NULL DEFAULT 'ACCEPTED',   -- FR-30: ACCEPTED / REJECTED
    placed_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_bids_auction_id ON nexus_auction.bids (auction_id);
CREATE INDEX IF NOT EXISTS ix_bids_bidder_id  ON nexus_auction.bids (bidder_id);
-- FR-28/31: lấy giá cao nhất & lịch sử đặt giá
CREATE INDEX IF NOT EXISTS ix_bids_auction_amount
    ON nexus_auction.bids (auction_id, amount DESC);
ALTER TABLE nexus_auction.bids
    ADD CONSTRAINT ck_bids_amount_positive CHECK (amount > 0);
ALTER TABLE nexus_auction.bids
    ADD CONSTRAINT ck_bids_status CHECK (status IN ('ACCEPTED', 'REJECTED'));


CREATE TABLE IF NOT EXISTS nexus_auction.auction_settlements (
    id          UUID          PRIMARY KEY,
    auction_id  UUID          NOT NULL REFERENCES nexus_auction.auctions (id) ON DELETE CASCADE,
    winner_id   UUID,
    order_id    UUID,                                -- tham chiếu logic tới nexus_commerce.orders
    final_price NUMERIC(19,2),
    status      VARCHAR(20)   NOT NULL DEFAULT 'WON',-- WON | FAILED | NO_BIDS (FR-35)
    settled_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ
);

-- FR-35: một phiên chỉ có duy nhất một biên bản chốt
CREATE UNIQUE INDEX IF NOT EXISTS ux_auction_settlements_auction_id
    ON nexus_auction.auction_settlements (auction_id);
ALTER TABLE nexus_auction.auction_settlements
    ADD CONSTRAINT ck_settlements_status CHECK (status IN ('WON', 'FAILED', 'NO_BIDS'));
