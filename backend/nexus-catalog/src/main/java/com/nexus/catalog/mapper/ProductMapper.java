package com.nexus.catalog.mapper;

import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.common.ProductSummaryResponse;
import com.nexus.catalog.dto.seller.ProductImageRequest;
import com.nexus.catalog.entity.Product;
import com.nexus.catalog.entity.ProductImage;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Mapper viết tay cho {@link Product} / {@link ProductImage} (không dùng MapStruct — §9).
 */
public final class ProductMapper {

    private ProductMapper() {
    }

    /**
     * Chi tiết sản phẩm kèm ảnh và tên danh mục (FR-06).
     *
     * @param images       danh sách ảnh đã sắp xếp theo {@code sortOrder}
     * @param categoryName tên danh mục, có thể null nếu sản phẩm chưa gán danh mục
     */
    public static ProductResponse toResponse(Product entity, List<ProductImage> images, String categoryName) {
        List<ProductImage> safeImages = images == null ? List.of() : images;
        List<String> imageUrls = safeImages.stream().map(image -> image.getImageUrl()).toList();
        return new ProductResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getBasePrice(),
                entity.getStatus(),
                entity.getSellerId(),
                entity.getCategoryId(),
                categoryName,
                primaryImageUrl(safeImages),
                imageUrls,
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    /** Bản rút gọn cho danh sách (FR-06, FR-11, FR-12, FR-53). */
    public static ProductSummaryResponse toSummary(Product entity, String categoryName, String primaryImageUrl) {
        return new ProductSummaryResponse(
                entity.getId(),
                entity.getName(),
                entity.getBasePrice(),
                entity.getStatus(),
                entity.getSellerId(),
                entity.getCategoryId(),
                categoryName,
                primaryImageUrl,
                entity.getCreatedAt());
    }

    /**
     * Ảnh chính của sản phẩm: ưu tiên ảnh có cờ {@code primary = true},
     * nếu không ảnh nào được đánh dấu thì lấy ảnh đầu tiên.
     */
    public static String primaryImageUrl(List<ProductImage> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        return images.stream()
                .filter(image -> Boolean.TRUE.equals(image.getPrimary()))
                .map(image -> image.getImageUrl())
                .findFirst()
                .orElseGet(() -> images.getFirst().getImageUrl());
    }

    /**
     * Chuyển danh sách ảnh trong request thành entity ảnh (FR-05, FR-07).
     * Quy tắc ảnh chính: ảnh đầu tiên được đánh dấu {@code primary = true} sẽ là ảnh chính;
     * nếu không ảnh nào đánh dấu thì ảnh đầu tiên trong danh sách là ảnh chính.
     */
    public static List<ProductImage> toImageEntities(UUID productId, List<ProductImageRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        boolean explicitPrimary = requests.stream().anyMatch(request -> Boolean.TRUE.equals(request.primary()));
        List<ProductImage> images = new ArrayList<>(requests.size());
        boolean primaryAssigned = false;
        for (int index = 0; index < requests.size(); index++) {
            ProductImageRequest request = requests.get(index);
            boolean wantsPrimary = Boolean.TRUE.equals(request.primary());
            boolean primary = !primaryAssigned && (wantsPrimary || (!explicitPrimary && index == 0));
            primaryAssigned = primaryAssigned || primary;
            images.add(ProductImage.builder()
                    .productId(productId)
                    .imageUrl(request.imageUrl() == null ? null : request.imageUrl().trim())
                    .primary(primary)
                    .sortOrder(index)
                    .build());
        }
        return images;
    }
}
