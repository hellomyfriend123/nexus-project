package com.nexus.commerce.enums;

/**
 * Kiểu giảm giá của mã giảm giá (FR-20/FR-47, §16).
 * <ul>
 *     <li>{@link #PERCENTAGE}: {@code giảm = amount * discountValue / 100}, ràng buộc {@code 0 < discountValue <= 100}.</li>
 *     <li>{@link #FIXED_AMOUNT}: giảm thẳng {@code discountValue}, nhưng KHÔNG được vượt quá giá trị đơn ({@code amount}).</li>
 * </ul>
 */
public enum DiscountType {

    PERCENTAGE,

    FIXED_AMOUNT
}
