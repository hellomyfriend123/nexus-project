package com.nexus.commerce.enums;

/**
 * Phương thức thanh toán (FR-21, §16).
 * Giai đoạn CRUD chỉ ghi nhận phương thức; {@link #MOCK} là mặc định để test luồng không cần cổng thanh toán.
 */
public enum PaymentMethod {

    /** Thanh toán khi nhận hàng. */
    COD,

    BANK_TRANSFER,

    E_WALLET,

    /** Giả lập — dùng cho demo/test khi chưa nối cổng thanh toán. */
    MOCK
}
