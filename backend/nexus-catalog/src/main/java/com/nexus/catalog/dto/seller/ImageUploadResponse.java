package com.nexus.catalog.dto.seller;

/**
 * Kết quả upload ảnh — trả về URL công khai để Seller dùng trong CreateProductRequest / UpdateProductRequest.
 */
public record ImageUploadResponse(String publicUrl) {}
