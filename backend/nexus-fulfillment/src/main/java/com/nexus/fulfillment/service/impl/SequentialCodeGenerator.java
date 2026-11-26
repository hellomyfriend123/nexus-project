package com.nexus.fulfillment.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;

import java.util.function.Predicate;

/**
 * Sinh mã hiển thị dạng {@code PREFIX-NNN} với {@code NNN} là <b>số thứ tự tự tăng</b>
 * ({@code 001}, {@code 002}, …) — dùng cho mã SKU ({@code SKU-001}) và mã vận đơn ({@code TRK-001}).
 * <p>
 * <b>Vì sao không lấy {@code count() + 1}?</b> Khi có bản ghi bị xoá, {@code count()} tụt xuống và
 * sinh lại số đã dùng → vi phạm unique index. Ở đây số kế tiếp được suy ra từ <b>số lớn nhất đang
 * có trong DB</b>, nên đúng cả sau khi xoá bản ghi và sau khi khởi động lại (không dùng biến đếm
 * trong RAM — biến đếm reset về 0 mỗi lần restart và đụng unique index ngay lập tức).
 * <p>
 * Chống đua: hai request song song có thể cùng tính ra một số. Lớp bảo vệ cuối là unique index trên
 * cột mã — nơi gọi bắt {@code DataIntegrityViolationException} rồi thử lại, cùng mức bảo vệ mà
 * {@code CheckoutServiceImpl} đang dùng cho {@code order_number}.
 * <p>
 * Không phải {@code @Service}: tiện ích thuần, không trạng thái, không phụ thuộc gì.
 */
final class SequentialCodeGenerator {

    /** Độ rộng tối thiểu của phần số: 001, 002, … 999; vượt 999 thì thành 1000 (không cắt cụt). */
    private static final int MIN_DIGITS = 3;

    /** Số lần nhảy sang số kế tiếp khi mã ứng viên đã tồn tại. */
    static final int MAX_ATTEMPTS = 10;

    private SequentialCodeGenerator() {
    }

    /**
     * Sinh mã kế tiếp còn trống.
     *
     * @param prefix    tiền tố, ví dụ {@code SKU} hoặc {@code TRK}
     * @param maxNumber số thứ tự lớn nhất đã dùng trong DB (0 nếu chưa có bản ghi nào)
     * @param exists    kiểm tra một mã đã tồn tại chưa (lớp bảo vệ thứ hai ngoài unique index)
     * @return mã dạng {@code PREFIX-NNN}
     */
    static String next(String prefix, int maxNumber, Predicate<String> exists) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            String candidate = format(prefix, maxNumber + attempt);
            if (!exists.test(candidate)) {
                return candidate;
            }
        }
        throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                "Không sinh được mã " + prefix + " duy nhất, vui lòng thử lại");
    }

    /** {@code PREFIX-NNN}: đệm '0' cho đủ 3 chữ số; số ≥ 1000 giữ nguyên độ dài thật. */
    static String format(String prefix, int number) {
        String digits = Integer.toString(Math.max(number, 1));
        return prefix + "-" + "0".repeat(Math.max(0, MIN_DIGITS - digits.length())) + digits;
    }

    /**
     * Tách số thứ tự khỏi một mã đã có, ví dụ {@code "SKU-007"} → {@code 7}.
     * Dùng để tìm số lớn nhất trong DB mà không phải parse lại ở nơi gọi.
     *
     * @return số thứ tự, hoặc {@code 0} nếu mã không đúng định dạng {@code PREFIX-<số>}
     */
    static int numberOf(String prefix, String code) {
        if (code == null) {
            return 0;
        }
        String expectedPrefix = prefix + "-";
        if (!code.startsWith(expectedPrefix)) {
            return 0;
        }
        try {
            return Integer.parseInt(code.substring(expectedPrefix.length()));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
