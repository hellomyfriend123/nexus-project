package com.nexus.catalog.dto.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Một ảnh trong danh sách ảnh của sản phẩm (FR-05, FR-07).
 * <p>
 * Tên field JSON là {@code primary} (tương ứng cột {@code is_primary} — §16) chứ không phải
 * {@code isPrimary}: Jackson coi accessor {@code isPrimary()} là getter của thuộc tính {@code primary},
 * nên đặt tên {@code primary} để hợp đồng JSON rõ ràng, không bị lệch tên khi (de)serialize.
 */
public record ProductImageRequest(

        @NotBlank(message = "URL ảnh không được để trống")
        @Size(max = 500, message = "URL ảnh tối đa 500 ký tự")
        String imageUrl,

        /*
         * true = ảnh chính. Nếu cả danh sách không có ảnh nào được đánh dấu, ảnh đầu tiên sẽ là ảnh chính.
         * Nếu nhiều ảnh cùng đánh dấu true, chỉ ảnh đầu tiên được giữ làm ảnh chính.
         */
        Boolean primary
) {
}
