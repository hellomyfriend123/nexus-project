package com.nexus.commerce.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Tiện ích tiền tệ dùng chung cho các mapper trong module (§15 yêu cầu:
 * mọi số tiền là {@code BigDecimal}, làm tròn {@code setScale(2, HALF_UP)}).
 *
 * <p>Đặt trong package {@code mapper} vì đây là chi tiết trình bày của tầng DTO,
 * không phải quy tắc nghiệp vụ (quy tắc nghiệp vụ nằm ở service).</p>
 */
public final class MoneyUtils {

    /** Số chữ số thập phân cố định cho mọi cột/số tiền trong module. */
    public static final int SCALE = 2;

    private MoneyUtils() {
    }

    /** Chuẩn hoá về scale 2, HALF_UP; null → 0.00 (tránh NPE khi map dữ liệu cũ). */
    public static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(SCALE, RoundingMode.HALF_UP);
    }
}
