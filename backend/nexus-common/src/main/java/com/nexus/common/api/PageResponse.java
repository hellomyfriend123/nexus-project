package com.nexus.common.api;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Bọc kết quả phân trang. KHÔNG trả {@code Page<T>} trực tiếp ra REST
 * (Page là lớp nội bộ của Spring Data, đổi cấu trúc JSON giữa các version).
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }

    /** Tiện dụng: map entity -> DTO ngay khi phân trang. */
    public static <T, S> PageResponse<S> from(Page<T> page, Function<T, S> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(),
                page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }

    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) totalElements / (double) size);
        return new PageResponse<>(content, page, size, totalElements, totalPages,
                page == 0, page >= totalPages - 1);
    }
}
