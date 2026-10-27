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
import com.nexus.catalog.entity.ProductImage;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.catalog.enums.ProductStatus;
import com.nexus.catalog.mapper.ProductMapper;
import com.nexus.catalog.repository.CategoryRepository;
import com.nexus.catalog.repository.ProductImageRepository;
import com.nexus.catalog.repository.ProductRepository;
import com.nexus.catalog.service.ProductService;
import com.nexus.catalog.specification.ProductSpecification;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Cài đặt nghiệp vụ sản phẩm (FR-05, FR-06, FR-07, FR-08, FR-10, FR-11, FR-12, FR-53).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    /** FR-12 — chỉ cho phép sắp xếp theo các thuộc tính có ý nghĩa với người dùng. */
    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of("basePrice", "createdAt", "name");

    private static final String DEFAULT_SORT_PROPERTY = "createdAt";

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public ProductResponse create(UUID sellerId, CreateProductRequest request) {
        // 1) Danh mục là bắt buộc và phải tồn tại (FR-05)
        Category category = requireCategory(request.categoryId());
        // 2) Giá cơ bản phải lớn hơn 0 (FR-05) — kiểm tra lại ở service để an toàn cả khi gọi nội bộ
        BigDecimal basePrice = requirePositivePrice(request.basePrice());
        String name = requireName(request.name());

        Product product = Product.builder()
                .sellerId(sellerId)
                .categoryId(category.getId())
                .name(name)
                .description(request.description())
                .basePrice(basePrice)
                // Sản phẩm mới hiển thị ngay; Admin có thể chuyển DRAFT/INACTIVE qua FR-53.
                .status(ProductStatus.ACTIVE)
                .build();
        Product saved = productRepository.save(product);
        List<ProductImage> images = saveImages(saved.getId(), request.images());
        return ProductMapper.toResponse(saved, images, category.getName());
    }

    @Override
    public ProductResponse update(UUID sellerId, UUID productId, UpdateProductRequest request) {
        Product product = requireOwnedProduct(sellerId, productId);
        BigDecimal basePrice = requirePositivePrice(request.basePrice());
        String name = requireName(request.name());

        product.setName(name);
        product.setDescription(request.description());
        product.setBasePrice(basePrice);
        productRepository.save(product);

        // Ghi chú (MVP): chiến lược đơn giản — xoá toàn bộ ảnh cũ rồi thêm lại danh sách ảnh mới.
        // Số ảnh mỗi sản phẩm nhỏ nên chấp nhận được; nếu cần tối ưu sẽ diff theo imageUrl ở giai đoạn sau.
        productImageRepository.deleteByProductId(product.getId());
        List<ProductImage> images = saveImages(product.getId(), request.images());
        return ProductMapper.toResponse(product, images, resolveCategoryName(product.getCategoryId()));
    }

    @Override
    public void delete(UUID sellerId, UUID productId) {
        Product product = requireOwnedProduct(sellerId, productId);
        // TODO (business logic): FR-08 — chặn xoá sản phẩm đang có auction/transaction active; cần gọi module auction/commerce ở giai đoạn sau.
        softDelete(product);
    }

    @Override
    public void deleteByAdmin(UUID productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        // Cùng quy tắc FR-08 như Seller — xem TODO trong delete(sellerId, productId) về auction/transaction.
        softDelete(product);
    }

    @Override
    public ProductResponse assignCategory(UUID sellerId, UUID productId, AssignCategoryRequest request) {
        Product product = requireOwnedProduct(sellerId, productId);
        Category category = requireCategory(request.categoryId());
        product.setCategoryId(category.getId());
        productRepository.save(product);
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        return ProductMapper.toResponse(product, images, category.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> search(String keyword, UUID categoryId, BigDecimal minPrice,
                                                       BigDecimal maxPrice, ProductStatus status, Pageable pageable) {
        Specification<Product> specification =
                ProductSpecification.filter(keyword, categoryId, minPrice, maxPrice, status);
        Page<Product> page = productRepository.findAll(specification, sanitizePageable(pageable));
        Map<UUID, String> categoryNames = resolveCategoryNames(page.getContent());
        Map<UUID, String> primaryImages = resolvePrimaryImages(page.getContent());
        return PageResponse.from(page, product -> ProductMapper.toSummary(
                product,
                product.getCategoryId() == null ? null : categoryNames.get(product.getCategoryId()),
                primaryImages.get(product.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(UUID productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        return toDetailResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> adminSearch(String keyword, UUID categoryId, ProductStatus status,
                                                            boolean includeDeleted, Pageable pageable) {
        Specification<Product> specification =
                ProductSpecification.filter(keyword, categoryId, null, null, status, includeDeleted);
        Page<Product> page = productRepository.findAll(specification, sanitizePageable(pageable));
        Map<UUID, String> categoryNames = resolveCategoryNames(page.getContent());
        Map<UUID, String> primaryImages = resolvePrimaryImages(page.getContent());
        return PageResponse.from(page, product -> ProductMapper.toSummary(
                product,
                product.getCategoryId() == null ? null : categoryNames.get(product.getCategoryId()),
                primaryImages.get(product.getId())));
    }

    @Override
    public ProductResponse updateStatus(UUID productId, UpdateProductStatusRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        if (request.status() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Trạng thái sản phẩm không được để trống");
        }
        product.setStatus(request.status());
        productRepository.save(product);
        return toDetailResponse(product);
    }

    // ------------------------------------------------------------------ tiện ích nội bộ

    private void softDelete(Product product) {
        product.setDeletedAt(Instant.now());
        productRepository.save(product);
    }

    private List<ProductImage> saveImages(UUID productId, List<ProductImageRequest> requests) {
        List<ProductImage> images = ProductMapper.toImageEntities(productId, requests);
        if (images.isEmpty()) {
            return List.of();
        }
        return productImageRepository.saveAll(images);
    }

    /**
     * Chi tiết sản phẩm: kèm ảnh + tên danh mục.
     * <p>
     * Phần "seller" hiện chỉ có {@code sellerId} (tham chiếu chéo module bằng UUID).
     * Giai đoạn sau, khi được phép phụ thuộc {@code nexus-user}, sẽ gọi service của module user
     * để bổ sung tên/email Seller — KHÔNG join JPA sang module khác (§2).
     */
    private ProductResponse toDetailResponse(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        return ProductMapper.toResponse(product, images, resolveCategoryName(product.getCategoryId()));
    }

    private String resolveCategoryName(UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId).map(category -> category.getName()).orElse(null);
    }

    /** Nạp tên danh mục cho cả trang kết quả bằng MỘT truy vấn (tránh N+1). */
    private Map<UUID, String> resolveCategoryNames(List<Product> products) {
        Set<UUID> categoryIds = products.stream()
                .map(product -> product.getCategoryId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (categoryIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> names = new HashMap<>();
        for (Category category : categoryRepository.findAllById(categoryIds)) {
            names.put(category.getId(), category.getName());
        }
        return names;
    }

    /** Nạp ảnh chính cho cả trang kết quả bằng MỘT truy vấn; ưu tiên ảnh có cờ primary = true. */
    private Map<UUID, String> resolvePrimaryImages(List<Product> products) {
        Set<UUID> productIds = products.stream()
                .map(product -> product.getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> primaryImages = new HashMap<>();
        Map<UUID, String> fallbackImages = new HashMap<>();
        for (ProductImage image : productImageRepository.findByProductIdInOrderBySortOrderAsc(productIds)) {
            fallbackImages.putIfAbsent(image.getProductId(), image.getImageUrl());
            if (Boolean.TRUE.equals(image.getPrimary())) {
                primaryImages.putIfAbsent(image.getProductId(), image.getImageUrl());
            }
        }
        fallbackImages.putAll(primaryImages);
        return fallbackImages;
    }

    /**
     * FR-12 — chỉ giữ các thuộc tính sắp xếp được phép; nếu không còn điều kiện hợp lệ nào
     * thì mặc định sắp xếp theo {@code createdAt} giảm dần (mới nhất trước).
     */
    private Pageable sanitizePageable(Pageable pageable) {
        Sort defaultSort = Sort.by(Sort.Direction.DESC, DEFAULT_SORT_PROPERTY);
        if (pageable == null) {
            return PageRequest.of(0, DEFAULT_PAGE_SIZE, defaultSort);
        }
        if (pageable.isUnpaged()) {
            return pageable;
        }
        List<Sort.Order> orders = pageable.getSort().stream()
                .filter(order -> ALLOWED_SORT_PROPERTIES.contains(order.getProperty()))
                .toList();
        Sort sort = orders.isEmpty() ? defaultSort : Sort.by(orders);
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    /** FR-05, FR-10 — danh mục bắt buộc, phải tồn tại và đang hoạt động. */
    private Category requireCategory(UUID categoryId) {
        if (categoryId == null) {
            throw new ResourceNotFoundException("Danh mục (categoryId) là bắt buộc và phải tồn tại");
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        if (category.getStatus() == CategoryStatus.INACTIVE) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "Danh mục '" + category.getName() + "' đã ngừng hoạt động, không thể gán cho sản phẩm");
        }
        return category;
    }

    /** FR-07, FR-08, FR-10 — chỉ chủ sở hữu mới được sửa/xoá sản phẩm. */
    private Product requireOwnedProduct(UUID sellerId, UUID productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        if (sellerId == null || !sellerId.equals(product.getSellerId())) {
            throw new ForbiddenOperationException("Bạn không phải chủ sở hữu sản phẩm này");
        }
        return product;
    }

    private BigDecimal requirePositivePrice(BigDecimal basePrice) {
        if (basePrice == null || basePrice.signum() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Giá cơ bản (basePrice) phải lớn hơn 0");
        }
        return basePrice;
    }

    private String requireName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Tên sản phẩm không được để trống");
        }
        return normalized;
    }
}
