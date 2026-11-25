-- Cấp mã SKU tuần tự dạng ORD-001, ORD-002, ... an toàn khi nhiều Seller tạo SKU đồng thời.
-- Đồng bộ với các mã ORD-xxx đã tồn tại trước khi bật sequence.
CREATE SEQUENCE IF NOT EXISTS nexus_fulfillment.sku_code_seq START WITH 1;

SELECT setval(
    'nexus_fulfillment.sku_code_seq',
    GREATEST(
        last_value,
        COALESCE((
            SELECT MAX(substring(sku_code FROM 5)::BIGINT)
            FROM nexus_fulfillment.skus
            WHERE sku_code ~ '^ORD-[0-9]+$'
        ), 1)
    ),
    is_called OR COALESCE((
        SELECT MAX(substring(sku_code FROM 5)::BIGINT)
        FROM nexus_fulfillment.skus
        WHERE sku_code ~ '^ORD-[0-9]+$'
    ), 0) > 0
)
FROM nexus_fulfillment.sku_code_seq;
