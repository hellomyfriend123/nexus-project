-- =====================================================================================
-- PROJECT NEXUS — TẠO SCHEMA
-- Mỗi module nghiệp vụ sở hữu MỘT schema riêng (ranh giới microservice ở tầng dữ liệu).
-- Chạy file này TRƯỚC các file 01..06.
--
--   psql "$DB_URL" -f db/00-create-schemas.sql
-- =====================================================================================

CREATE SCHEMA IF NOT EXISTS nexus_user;
CREATE SCHEMA IF NOT EXISTS nexus_catalog;
CREATE SCHEMA IF NOT EXISTS nexus_fulfillment;
CREATE SCHEMA IF NOT EXISTS nexus_commerce;
CREATE SCHEMA IF NOT EXISTS nexus_auction;
CREATE SCHEMA IF NOT EXISTS nexus_notification;

COMMENT ON SCHEMA nexus_user        IS 'Module user        — FR-01..04, FR-52';
COMMENT ON SCHEMA nexus_catalog     IS 'Module catalog     — FR-05..12, FR-41,42,45, FR-53,54,59';
COMMENT ON SCHEMA nexus_fulfillment IS 'Module fulfillment — FR-13,14, FR-38..40, FR-55';
COMMENT ON SCHEMA nexus_commerce    IS 'Module commerce    — FR-15..25, FR-43,44, FR-46..48, FR-56,58';
COMMENT ON SCHEMA nexus_auction     IS 'Module auction     — FR-26..37, FR-57';
COMMENT ON SCHEMA nexus_notification IS 'Module notification — FR-49..51';
