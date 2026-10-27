package com.nexus.catalog.service.impl;

import com.nexus.catalog.dto.admin.CreateCategoryRequest;
import com.nexus.catalog.dto.admin.UpdateCategoryRequest;
import com.nexus.catalog.dto.common.CategoryResponse;
import com.nexus.catalog.entity.Category;
import com.nexus.catalog.enums.CategoryStatus;
import com.nexus.catalog.mapper.CategoryMapper;
import com.nexus.catalog.repository.CategoryRepository;
import com.nexus.catalog.repository.ProductRepository;
import com.nexus.catalog.service.CategoryService;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Cài đặt nghiệp vụ danh mục (FR-09, FR-54).
 * <p>
 * {@code ProductRepository} được dùng ở đây là repository CÙNG module (không vi phạm §2) để
 * kiểm tra "danh mục còn sản phẩm đang hoạt động hay không" trước khi xoá.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    /** Giới hạn độ sâu khi dò ngược cây danh mục để phát hiện vòng lặp. */
    private static final int MAX_CATEGORY_DEPTH = 20;

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveTree() {
        return CategoryMapper.toTree(categoryRepository.findByStatusOrderBySortOrderAscNameAsc(CategoryStatus.ACTIVE));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> listForAdmin(CategoryStatus status, Pageable pageable) {
        Page<Category> page = status == null
                ? categoryRepository.findAll(pageable)
                : categoryRepository.findByStatus(status, pageable);
        return PageResponse.from(page, CategoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(UUID categoryId) {
        return CategoryMapper.toResponse(requireCategory(categoryId));
    }

    @Override
    public CategoryResponse create(CreateCategoryRequest request) {
        Category parent = resolveParent(request.parentId());
        Category category = Category.builder()
                .name(requireName(request.name()))
                .description(request.description())
                .parentId(parent == null ? null : parent.getId())
                // Mặc định ACTIVE khi client không gửi trạng thái
                .status(request.status() == null ? CategoryStatus.ACTIVE : request.status())
                .sortOrder(request.sortOrder())
                .build();
        return CategoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse update(UUID categoryId, UpdateCategoryRequest request) {
        Category category = requireCategory(categoryId);
        if (request.status() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Trạng thái danh mục không được để trống");
        }
        if (categoryId.equals(request.parentId())) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "Danh mục không thể là danh mục cha của chính nó");
        }
        if (request.parentId() != null) {
            ensureNoCycle(categoryId, request.parentId());
        }
        category.setName(requireName(request.name()));
        category.setDescription(request.description());
        category.setParentId(request.parentId());
        category.setStatus(request.status());
        category.setSortOrder(request.sortOrder());
        categoryRepository.save(category);
        return CategoryMapper.toResponse(category);
    }

    @Override
    public void deactivate(UUID categoryId) {
        Category category = requireCategory(categoryId);
        if (productRepository.existsByCategoryIdAndDeletedAtIsNull(categoryId)) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "Không thể xoá danh mục vì vẫn còn sản phẩm đang hoạt động thuộc danh mục này");
        }
        if (categoryRepository.existsByParentId(categoryId)) {
            throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                    "Không thể xoá danh mục vì vẫn còn danh mục con");
        }
        // FR-09/FR-54: "xoá" danh mục = chuyển sang INACTIVE, KHÔNG hard delete
        category.setStatus(CategoryStatus.INACTIVE);
        categoryRepository.save(category);
    }

    // ------------------------------------------------------------------ tiện ích nội bộ

    private Category requireCategory(UUID categoryId) {
        if (categoryId == null) {
            throw new ResourceNotFoundException("Danh mục không tồn tại");
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
    }

    private Category resolveParent(UUID parentId) {
        if (parentId == null) {
            return null;
        }
        return requireCategory(parentId);
    }

    /**
     * FR-09/FR-54 — chặn tạo vòng lặp: danh mục cha mới không được nằm trong nhánh con của chính nó.
     * Dò ngược từ danh mục cha mới lên tới gốc, tối đa {@value #MAX_CATEGORY_DEPTH} cấp.
     */
    private void ensureNoCycle(UUID categoryId, UUID newParentId) {
        UUID current = newParentId;
        int depth = 0;
        while (current != null) {
            if (current.equals(categoryId)) {
                throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                        "Không thể gán danh mục cha: sẽ tạo vòng lặp trong cây danh mục");
            }
            if (depth >= MAX_CATEGORY_DEPTH) {
                throw new BusinessException(ErrorCode.BUSINESS_RULE_VIOLATION,
                        "Cây danh mục vượt quá độ sâu cho phép (" + MAX_CATEGORY_DEPTH + " cấp)");
            }
            Category parent = requireCategory(current);
            current = parent.getParentId();
            depth++;
        }
    }

    private String requireName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Tên danh mục không được để trống");
        }
        return normalized;
    }
}
