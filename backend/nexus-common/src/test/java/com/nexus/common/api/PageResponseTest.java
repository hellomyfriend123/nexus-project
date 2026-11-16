package com.nexus.common.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PageResponseTest {

    @Test
    @DisplayName("from(Page) giữ đúng số liệu phân trang")
    void fromPageKeepsPaginationMetadata() {
        Page<String> page = new PageImpl<>(List.of("a", "b"), PageRequest.of(1, 2), 5);

        PageResponse<String> response = PageResponse.from(page);

        assertThat(response.content()).containsExactly("a", "b");
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(2);
        assertThat(response.totalElements()).isEqualTo(5);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.first()).isFalse();
        assertThat(response.last()).isFalse();
    }

    @Test
    @DisplayName("from(Page, mapper) map luôn phần tử sang DTO")
    void fromPageWithMapperMapsContent() {
        Page<Integer> page = new PageImpl<>(List.of(1, 2), PageRequest.of(0, 2), 2);

        PageResponse<String> response = PageResponse.from(page, value -> "so-" + value);

        assertThat(response.content()).containsExactly("so-1", "so-2");
        assertThat(response.first()).isTrue();
        assertThat(response.last()).isTrue();
    }

    @Test
    @DisplayName("of(...) tính totalPages và cờ first/last")
    void ofComputesFlags() {
        PageResponse<String> empty = PageResponse.of(List.of(), 0, 10, 0);

        assertThat(empty.totalPages()).isZero();
        assertThat(empty.first()).isTrue();
        assertThat(empty.last()).isTrue();
    }
}
