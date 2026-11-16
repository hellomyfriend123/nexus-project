package com.nexus.catalog.service.impl;

import com.nexus.catalog.dto.admin.UpdateProductStatusRequest;
import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.common.ProductSummaryResponse;
import com.nexus.catalog.dto.seller.AssignCategoryRequest;
import com.nexus.catalog.dto.seller.CreateProductRequest;
import com.nexus.catalog.dto.seller.ProductImageRequest;
import com.nexus.catalog.dto.seller.UpdateProductRequest;
import com.nexus.catalog.entity.Category;
import com.nexus.catalog.entity.Product;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.catalog.enums.ProductStatus;
import com.nexus.catalog.repository.CategoryRepository;
import com.nexus.catalog.repository.ProductImageRepository;
import com.nexus.catalog.repository.ProductRepository;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

/**
 * Test nghiệp vụ thuần Mockito cho {@link ProductServiceImpl} (§14) — không Spring context, không DB.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    private static final BigDecimal GIA_HOP_LE = new BigDecimal("150000.00");

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productService = new ProductServiceImpl(productRepository, productImageRepository, categoryRepository);
    }

    // ------------------------------------------------------------------ FR-05 tạo sản phẩm

    @Test
    @DisplayName("FR-05: tạo sản phẩm với categoryId không tồn tại → ResourceNotFoundException")
    void create_voiCategoryKhongTonTai_nemResourceNotFoundException() {
        UUID sellerId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        CreateProductRequest request = new CreateProductRequest("Tai nghe Bluetooth", "Mô tả",
                GIA_HOP_LE, categoryId, List.of(new ProductImageRequest("https://cdn.nexus/a.jpg", true)));
        given(categoryRepository.findById(categoryId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.create(sellerId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Category");

        then(productRepository).should(never()).save(any(Product.class));
    }

    @Test
    @DisplayName("FR-05: tạo sản phẩm hợp lệ → gán sellerId từ token, lưu ảnh, ảnh chính đúng")
    void create_hopLe_ganSellerIdVaAnh() {
        UUID sellerId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        Category category = category(categoryId, "Thiết bị âm thanh");
        CreateProductRequest request = new CreateProductRequest("Tai nghe Bluetooth", "Mô tả",
                GIA_HOP_LE, categoryId, List.of(
                new ProductImageRequest("https://cdn.nexus/a.jpg", Boolean.FALSE),
                new ProductImageRequest("https://cdn.nexus/b.jpg", Boolean.TRUE)));

        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category));
        given(productRepository.save(any(Product.class))).willAnswer(invocation -> {
            Product entity = invocation.getArgument(0);
            entity.setId(productId);
            return entity;
        });
        given(productImageRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.create(sellerId, request);

        assertThat(response.id()).isEqualTo(productId);
        assertThat(response.sellerId()).isEqualTo(sellerId);
        assertThat(response.categoryId()).isEqualTo(categoryId);
        assertThat(response.categoryName()).isEqualTo("Thiết bị âm thanh");
        assertThat(response.status()).isEqualTo(ProductStatus.ACTIVE);
        assertThat(response.images()).hasSize(2);
        assertThat(response.primaryImageUrl()).isEqualTo("https://cdn.nexus/b.jpg");

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        then(productRepository).should().save(productCaptor.capture());
        assertThat(productCaptor.getValue().getSellerId()).isEqualTo(sellerId);
        assertThat(productCaptor.getValue().getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("FR-05: basePrice = 0 → BusinessException (giá phải lớn hơn 0)")
    void create_voiGiaKhongHopLe_nemBusinessException() {
        UUID categoryId = UUID.randomUUID();
        CreateProductRequest request = new CreateProductRequest("Tai nghe", "Mô tả",
                BigDecimal.ZERO, categoryId, List.of());
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category(categoryId, "Âm thanh")));

        assertThatThrownBy(() -> productService.create(UUID.randomUUID(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("basePrice");
    }

    // ------------------------------------------------------------------ FR-07 cập nhật sản phẩm

    @Test
    @DisplayName("FR-07: Seller khác sửa sản phẩm → ForbiddenOperationException")
    void update_boiSellerKhac_nemForbiddenOperationException() {
        UUID productId = UUID.randomUUID();
        UUID chuSoHuu = UUID.randomUUID();
        UUID sellerKhac = UUID.randomUUID();
        Product product = product(productId, chuSoHuu, UUID.randomUUID());
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.of(product));

        UpdateProductRequest request = new UpdateProductRequest("Tên mới", "Mô tả mới", GIA_HOP_LE,
                List.of(new ProductImageRequest("https://cdn.nexus/a.jpg", true)));

        assertThatThrownBy(() -> productService.update(sellerKhac, productId, request))
                .isInstanceOf(ForbiddenOperationException.class);

        then(productRepository).should(never()).save(any(Product.class));
    }

    @Test
    @DisplayName("FR-07: chủ sở hữu cập nhật → ghi đè tên/giá và thay toàn bộ ảnh")
    void update_boiChuSoHuu_capNhatThanhCong() {
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        Product product = product(productId, sellerId, categoryId);
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.of(product));
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(category(categoryId, "Âm thanh")));
        given(productImageRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));

        UpdateProductRequest request = new UpdateProductRequest("Tai nghe mới", "Mô tả mới",
                new BigDecimal("250000.00"), List.of(new ProductImageRequest("https://cdn.nexus/new.jpg", true)));

        ProductResponse response = productService.update(sellerId, productId, request);

        assertThat(product.getName()).isEqualTo("Tai nghe mới");
        assertThat(product.getBasePrice()).isEqualByComparingTo("250000.00");
        assertThat(response.images()).containsExactly("https://cdn.nexus/new.jpg");
        assertThat(response.primaryImageUrl()).isEqualTo("https://cdn.nexus/new.jpg");
        then(productImageRepository).should().deleteByProductId(productId);
        then(productRepository).should().save(product);
    }

    // ------------------------------------------------------------------ FR-08 xoá mềm

    @Test
    @DisplayName("FR-08: xoá mềm sản phẩm của chính mình → set deletedAt, KHÔNG hard delete")
    void delete_cuaChuSoHuu_setDeletedAt() {
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        Product product = product(productId, sellerId, UUID.randomUUID());
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.of(product));

        productService.delete(sellerId, productId);

        assertThat(product.getDeletedAt()).isNotNull();
        then(productRepository).should().save(product);
        then(productRepository).should(never()).delete(any(Product.class));
    }

    @Test
    @DisplayName("FR-08: Seller khác xoá sản phẩm → ForbiddenOperationException")
    void delete_boiSellerKhac_nemForbiddenOperationException() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, UUID.randomUUID(), UUID.randomUUID());
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.delete(UUID.randomUUID(), productId))
                .isInstanceOf(ForbiddenOperationException.class);

        assertThat(product.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("FR-08: xoá sản phẩm không tồn tại (hoặc đã xoá mềm) → ResourceNotFoundException")
    void delete_khongTonTai_nemResourceNotFoundException() {
        UUID productId = UUID.randomUUID();
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.delete(UUID.randomUUID(), productId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------------ FR-10 gán danh mục

    @Test
    @DisplayName("FR-10: gán danh mục không tồn tại → ResourceNotFoundException")
    void assignCategory_voiCategoryKhongTonTai_nemResourceNotFoundException() {
        UUID productId = UUID.randomUUID();
        UUID sellerId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        given(productRepository.findByIdAndDeletedAtIsNull(productId))
                .willReturn(Optional.of(product(productId, sellerId, null)));
        given(categoryRepository.findById(categoryId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.assignCategory(sellerId, productId, new AssignCategoryRequest(categoryId)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------------ FR-11, FR-12 tìm kiếm

    @Test
    @DisplayName("FR-11/FR-12: tìm kiếm trả về PageResponse và chỉ dùng specification chưa xoá mềm")
    void search_traVePageResponse() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, UUID.randomUUID(), UUID.randomUUID());
        Pageable pageable = PageRequest.of(0, 20);
        given(productRepository.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(product), pageable, 1));

        PageResponse<ProductSummaryResponse> result =
                productService.search("tai nghe", null, null, null, null, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().getFirst().id()).isEqualTo(productId);
        assertThat(result.totalElements()).isEqualTo(1);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Specification<Product>> specificationCaptor = ArgumentCaptor.forClass(Specification.class);
        then(productRepository).should().findAll(specificationCaptor.capture(), any(Pageable.class));
        assertThat(specificationCaptor.getValue()).isNotNull();
    }

    @Test
    @DisplayName("FR-06: xem chi tiết sản phẩm đã xoá mềm → ResourceNotFoundException")
    void getById_khongTonTai_nemResourceNotFoundException() {
        UUID productId = UUID.randomUUID();
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getById(productId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ------------------------------------------------------------------ FR-53 đổi trạng thái

    @Test
    @DisplayName("FR-53: Admin đổi trạng thái sản phẩm sang INACTIVE")
    void updateStatus_doiTrangThaiThanhCong() {
        UUID productId = UUID.randomUUID();
        Product product = product(productId, UUID.randomUUID(), UUID.randomUUID());
        given(productRepository.findByIdAndDeletedAtIsNull(productId)).willReturn(Optional.of(product));

        ProductResponse response = productService.updateStatus(productId,
                new UpdateProductStatusRequest(ProductStatus.INACTIVE));

        assertThat(response.status()).isEqualTo(ProductStatus.INACTIVE);
        then(productRepository).should().save(product);
    }

    // ------------------------------------------------------------------ dữ liệu mẫu

    private static Category category(UUID id, String name) {
        Category category = Category.builder()
                .name(name)
                .status(CategoryStatus.ACTIVE)
                .sortOrder(1)
                .build();
        category.setId(id);
        return category;
    }

    private static Product product(UUID id, UUID sellerId, UUID categoryId) {
        Product product = Product.builder()
                .sellerId(sellerId)
                .categoryId(categoryId)
                .name("Tai nghe Bluetooth")
                .description("Mô tả")
                .basePrice(GIA_HOP_LE)
                .status(ProductStatus.ACTIVE)
                .build();
        product.setId(id);
        return product;
    }
}
