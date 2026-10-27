package com.nexus.catalog.service.impl;

import com.nexus.catalog.dto.admin.CreateCategoryRequest;
import com.nexus.catalog.dto.admin.UpdateCategoryRequest;
import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.entity.Category;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.catalog.repository.CategoryRepository;
import com.nexus.catalog.repository.ProductRepository;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

/**
 * Test nghiệp vụ thuần Mockito cho {@link CategoryServiceImpl} (§14) — FR-09, FR-54.
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    private CategoryServiceImpl categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryServiceImpl(categoryRepository, productRepository);
    }

    // ------------------------------------------------------------------ FR-09/FR-54 xoá danh mục

    @Test
    @DisplayName("FR-09/FR-54: xoá danh mục còn sản phẩm đang hoạt động → BusinessException")
    void deactivate_conSanPhamHoatDong_nemBusinessException() {
        UUID categoryId = UUID.randomUUID();
        Category category = category(categoryId, "Điện tử", null);
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));
        given(productRepository.existsByCategoryIdAndDeletedAtIsNull(categoryId)).willReturn(true);

        assertThatThrownBy(() -> categoryService.deactivate(categoryId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("sản phẩm");

        // Không được đổi trạng thái khi vẫn còn sản phẩm
        assertThat(category.getStatus()).isEqualTo(CategoryStatus.ACTIVE);
        then(categoryRepository).should(never()).save(category);
    }

    @Test
    @DisplayName("FR-09/FR-54: xoá danh mục còn danh mục con → BusinessException")
    void deactivate_conDanhMucCon_nemBusinessException() {
        UUID categoryId = UUID.randomUUID();
        Category category = category(categoryId, "Điện tử", null);
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));
        given(categoryRepository.existsByParentId(categoryId)).willReturn(true);

        assertThatThrownBy(() -> categoryService.deactivate(categoryId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("danh mục con");
    }

    @Test
    @DisplayName("FR-09/FR-54: xoá danh mục rỗng → chuyển INACTIVE (không hard delete)")
    void deactivate_danhMucRong_chuyenInactive() {
        UUID categoryId = UUID.randomUUID();
        Category category = category(categoryId, "Điện tử", null);
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));

        categoryService.deactivate(categoryId);

        assertThat(category.getStatus()).isEqualTo(CategoryStatus.INACTIVE);
        then(categoryRepository).should().save(category);
        then(categoryRepository).should(never()).delete(category);
    }

    @Test
    @DisplayName("FR-09/FR-54: xoá danh mục không tồn tại → ResourceNotFoundException")
    void deactivate_khongTonTai_nemResourceNotFoundException() {
        UUID categoryId = UUID.randomUUID();
        given(categoryRepository.findById(categoryId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.deactivate(categoryId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------------ FR-09/FR-54 cập nhật danh mục

    @Test
    @DisplayName("FR-09/FR-54: đặt chính danh mục làm danh mục cha → BusinessException")
    void update_danhMucChaLaChinhNo_nemBusinessException() {
        UUID categoryId = UUID.randomUUID();
        Category category = category(categoryId, "Điện tử", null);
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));

        UpdateCategoryRequest request = new UpdateCategoryRequest("Điện tử", "Mô tả", categoryId, 1,
                CategoryStatus.ACTIVE);

        assertThatThrownBy(() -> categoryService.update(categoryId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chính nó");
    }

    @Test
    @DisplayName("FR-09/FR-54: danh mục cha mới nằm trong nhánh con → BusinessException (chống vòng lặp)")
    void update_taoVongLapCayDanhMuc_nemBusinessException() {
        UUID rootId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        Category root = category(rootId, "Điện tử", null);
        Category child = category(childId, "Điện thoại", rootId);
        given(categoryRepository.findById(rootId)).willReturn(Optional.of(root));
        // Đi ngược từ cha mới (childId) lên trên sẽ gặp chính rootId → vòng lặp
        given(categoryRepository.findById(childId)).willReturn(Optional.of(child));

        UpdateCategoryRequest request = new UpdateCategoryRequest("Điện tử", "Mô tả", childId, 1,
                CategoryStatus.ACTIVE);

        assertThatThrownBy(() -> categoryService.update(rootId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vòng lặp");
    }

    @Test
    @DisplayName("FR-09/FR-54: tạo danh mục con với danh mục cha không tồn tại → ResourceNotFoundException")
    void create_voiDanhMucChaKhongTonTai_nemResourceNotFoundException() {
        UUID parentId = UUID.randomUUID();
        given(categoryRepository.findById(parentId)).willReturn(Optional.empty());

        CreateCategoryRequest request = new CreateCategoryRequest("Điện thoại", "Mô tả", parentId, 1,
                CategoryStatus.ACTIVE);

        assertThatThrownBy(() -> categoryService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------------ FR-09 xem cây danh mục

    @Test
    @DisplayName("FR-09: trả về cây danh mục ACTIVE (cha + con), chỉ gọi truy vấn lọc ACTIVE")
    void getActiveTree_traVeCayChaCon() {
        UUID rootId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        Category root = category(rootId, "Điện tử", null);
        Category child = category(childId, "Điện thoại", rootId);
        given(categoryRepository.findByStatusOrderBySortOrderAscNameAsc(CategoryStatus.ACTIVE))
                .willReturn(List.of(root, child));

        List<CategoryResponse> tree = categoryService.getActiveTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.getFirst().name()).isEqualTo("Điện tử");
        assertThat(tree.getFirst().children()).hasSize(1);
        assertThat(tree.getFirst().children().getFirst().name()).isEqualTo("Điện thoại");
    }

    // ------------------------------------------------------------------ dữ liệu mẫu

    private static Category category(UUID id, String name, UUID parentId) {
        Category category = Category.builder()
                .name(name)
                .description("Mô tả")
                .parentId(parentId)
                .status(CategoryStatus.ACTIVE)
                .sortOrder(1)
                .build();
        category.setId(id);
        return category;
    }
}
