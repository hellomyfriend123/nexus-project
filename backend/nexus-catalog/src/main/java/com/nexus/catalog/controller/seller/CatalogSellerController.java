package com.nexus.catalog.controller.seller;

import com.nexus.catalog.dto.common.ProductResponse;
import com.nexus.catalog.dto.seller.AssignCategoryRequest;
import com.nexus.catalog.dto.seller.CreateProductRequest;
import com.nexus.catalog.dto.seller.UpdateProductRequest;
import com.nexus.catalog.service.ProductService;
import com.nexus.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint quản lý sản phẩm của Seller.
 * {@code sellerId} luôn lấy từ token ({@link SecurityUtils#currentUserId()}), KHÔNG nhận từ request.
 */
@RestController
@RequestMapping("/api/v1/seller/catalog/products")
@Tag(name = "Catalog — Seller", description = "FR-05, FR-07, FR-08, FR-10")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class CatalogSellerController {

    private final ProductService productService;

    @PostMapping
    @Operation(summary = "FR-05 — Seller tạo sản phẩm")
    @ApiResponse(responseCode = "201", description = "Tạo sản phẩm thành công")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(sellerId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "FR-07 — Seller cập nhật sản phẩm của chính mình (403 nếu không phải chủ sở hữu)")
    @ApiResponse(responseCode = "200", description = "Cập nhật thành công")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest request) {
        return productService.update(SecurityUtils.currentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "FR-08 — Seller xoá mềm sản phẩm của chính mình")
    @ApiResponse(responseCode = "204", description = "Xoá mềm thành công")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        productService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/category")
    @Operation(summary = "FR-10 — Seller gán/đổi danh mục cho sản phẩm của chính mình")
    @ApiResponse(responseCode = "200", description = "Gán danh mục thành công")
    public ProductResponse assignCategory(@PathVariable UUID id,
                                          @Valid @RequestBody AssignCategoryRequest request) {
        return productService.assignCategory(SecurityUtils.currentUserId(), id, request);
    }
}
