-- =====================================================================================
-- MODULE NOTIFICATION — schema nexus_notification
-- FR-49 (tạo thông báo theo event), FR-50 (xem), FR-51 (đánh dấu đã đọc)
--
-- Chỉ làm IN-APP theo baseline 5.13 → KHÔNG có cột channel (EMAIL/PUSH).
-- =====================================================================================

CREATE TABLE IF NOT EXISTS nexus_notification.notifications (
    id             UUID         PRIMARY KEY,
    user_id        UUID         NOT NULL,            -- tham chiếu logic tới nexus_user.users
    event_type     VARCHAR(50)  NOT NULL,            -- 23 giá trị theo FR-49
    title          VARCHAR(255) NOT NULL,
    content        TEXT,
    reference_type VARCHAR(50),                      -- ORDER | AUCTION | SHIPMENT | PRODUCT | REVIEW
    reference_id   UUID,
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_notifications_user_id    ON nexus_notification.notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON nexus_notification.notifications (created_at DESC);
-- FR-50: lọc "chỉ chưa đọc" và đếm badge
CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
    ON nexus_notification.notifications (user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS ix_notifications_user_event
    ON nexus_notification.notifications (user_id, event_type);

-- 23 giá trị hợp lệ của event_type (FR-49)
ALTER TABLE nexus_notification.notifications
    ADD CONSTRAINT ck_notifications_event_type CHECK (event_type IN (
        'USER_REGISTERED',
        'PRODUCT_CREATED', 'PRODUCT_UPDATED',
        'CART_ITEM_ADDED', 'CART_ITEM_UPDATED', 'CART_ITEM_REMOVED',
        'ORDER_CREATED', 'ORDER_PAID', 'ORDER_PAYMENT_FAILED', 'ORDER_COMPLETED', 'ORDER_CANCELLED',
        'AUCTION_CREATED', 'AUCTION_STARTED', 'BID_PLACED', 'OUTBID', 'AUCTION_CANCELLED',
        'AUCTION_ENDED', 'AUCTION_WON', 'AUCTION_FAILED',
        'SHIPMENT_CREATED', 'SHIPMENT_DELIVERED',
        'REVIEW_RECEIVED',
        'SYSTEM_ANNOUNCEMENT'
    ));
