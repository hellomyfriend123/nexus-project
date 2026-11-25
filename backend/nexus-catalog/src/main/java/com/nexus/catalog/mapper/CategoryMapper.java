package com.nexus.catalog.mapper;

import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.entity.Category;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Mapper viết tay cho {@link Category} (không dùng MapStruct — §9).
 * Bao gồm hàm dựng cây danh mục từ danh sách phẳng (FR-09).
 */
public final class CategoryMapper {

    private CategoryMapper() {
    }

    /** DTO phẳng (không kèm danh mục con) — dùng cho danh sách quản trị. */
    public static CategoryResponse toResponse(Category entity) {
        return toResponse(entity, List.of());
    }

    /** DTO kèm danh sách danh mục con đã dựng sẵn. */
    public static CategoryResponse toResponse(Category entity, List<CategoryResponse> children) {
        return new CategoryResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getParentId(),
                entity.getStatus(),
                entity.getSortOrder(),
                children == null ? List.of() : List.copyOf(children));
    }

    public static List<CategoryResponse> toResponseList(List<Category> entities) {
        return entities == null ? List.of() : entities.stream().map(CategoryMapper::toResponse).toList();
    }

    /**
     * Dựng cây danh mục từ danh sách phẳng (FR-09).
     * <p>
     * Danh mục có {@code parentId} null — hoặc trỏ tới một danh mục không nằm trong danh sách đầu vào —
     * được coi là gốc, nhờ vậy dữ liệu "mồ côi" (danh mục cha đã bị ẩn) vẫn hiển thị thay vì bị mất.
     * Hàm cũng chống đệ quy vô hạn nếu dữ liệu bị lỗi vòng lặp.
     */
    public static List<CategoryResponse> toTree(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return List.of();
        }
        Set<UUID> presentIds = new HashSet<>();
        Map<UUID, List<Category>> childrenByParent = new LinkedHashMap<>();
        for (Category category : categories) {
            presentIds.add(category.getId());
            childrenByParent.computeIfAbsent(category.getParentId(), key -> new ArrayList<>()).add(category);
        }
        List<CategoryResponse> tree = new ArrayList<>();
        for (Category category : categories) {
            boolean root = category.getParentId() == null || !presentIds.contains(category.getParentId());
            if (root) {
                tree.add(toNode(category, childrenByParent, new HashSet<>()));
            }
        }
        return List.copyOf(tree);
    }

    private static CategoryResponse toNode(Category category, Map<UUID, List<Category>> childrenByParent,
                                           Set<UUID> visited) {
        if (!visited.add(category.getId())) {
            // Dữ liệu bị lỗi vòng lặp (A là cha của B và ngược lại) → trả về nút lá để không treo
            return toResponse(category);
        }
        List<CategoryResponse> children = childrenByParent.getOrDefault(category.getId(), List.of()).stream()
                .map(child -> toNode(child, childrenByParent, visited))
                .toList();
        return toResponse(category, children);
    }
}
