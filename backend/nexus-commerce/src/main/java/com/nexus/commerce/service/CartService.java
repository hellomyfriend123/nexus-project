package com.nexus.commerce.service;

import com.nexus.commerce.dto.buyer.AddCartItemRequest;
import com.nexus.commerce.dto.buyer.CartResponse;
import com.nexus.commerce.dto.buyer.UpdateCartItemRequest;

import java.util.UUID;

/**
 * Giỏ hàng — FR-15 (xem/tạo giỏ ACTIVE), FR-16 (thêm), FR-17 (sửa), FR-18 (xoá dòng hàng).
 */
public interface CartService {

    /**
     * FR-15 — lấy giỏ {@code ACTIVE} của Buyer; nếu chưa có thì tạo mới.
     * Bảo đảm bất biến "mỗi buyer chỉ một cart ACTIVE".
     */
    CartResponse getOrCreateActiveCart(UUID buyerId);

    /** FR-16 — thêm dòng hàng; trùng {@code productId + skuId} thì cộng dồn quantity. */
    CartResponse addItem(UUID buyerId, AddCartItemRequest request);

    /** FR-17 — đổi số lượng dòng hàng rồi tính lại subtotal của giỏ. */
    CartResponse updateItem(UUID buyerId, UUID itemId, UpdateCartItemRequest request);

    /** FR-18 — xoá dòng hàng khỏi giỏ (đây là dữ liệu giỏ tạm, không phải bản ghi nghiệp vụ nên được xoá thật). */
    CartResponse removeItem(UUID buyerId, UUID itemId);
}
