package com.nexus.catalog.service;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Upload ảnh sản phẩm lên Supabase Storage và trả về public URL.
 * <p>
 * Supabase Storage REST API:
 *   PUT  /storage/v1/object/{bucket}/{path}  — upload file
 * Public URL: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
 */
@Slf4j
@Service
public class SupabaseStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5 MB

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String bucket;

    @Autowired
    public SupabaseStorageService(
            @Value("${nexus.supabase.url}") String supabaseUrl,
            @Value("${nexus.supabase.service-role-key}") String serviceRoleKey,
            @Value("${nexus.supabase.storage-bucket:product-images}") String bucket) {
        this(supabaseUrl, bucket, RestClient.builder()
                .baseUrl(supabaseUrl.replaceAll("/$", "") + "/storage/v1/object")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .build());
    }

    /**
     * Package-private constructor for testing without hitting live Supabase.
     */
    SupabaseStorageService(String supabaseUrl, String bucket, RestClient restClient) {
        this.supabaseUrl = supabaseUrl.replaceAll("/$", "");
        this.bucket = bucket;
        this.restClient = restClient;
    }

    /**
     * Uploads a product image and returns its public URL.
     *
     * @param productId the owning product's UUID (used as folder prefix)
     * @param file      the multipart file from the HTTP request
     * @return public URL of the uploaded image (e.g. https://xxx.supabase.co/storage/v1/object/public/...)
     */
    public String uploadProductImage(UUID productId, MultipartFile file) {
        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        // Path inside bucket: product-images/products/{productId}/{randomUUID}.{ext}
        String objectPath = "products/%s/%s.%s".formatted(productId, UUID.randomUUID(), extension);

        try {
            byte[] bytes = file.getBytes();
            restClient.put()
                    .uri("/" + bucket + "/" + objectPath)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .body(bytes)
                    .retrieve()
                    .toBodilessEntity();

            String publicUrl = "%s/storage/v1/object/public/%s/%s"
                    .formatted(supabaseUrl, bucket, objectPath);
            log.info("[STORAGE] Uploaded product image for product {}: {}", productId, publicUrl);
            return publicUrl;

        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không thể đọc dữ liệu file: " + e.getMessage());
        } catch (Exception e) {
            log.error("[STORAGE] Upload failed for product {}: {}", productId, e.getMessage(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Upload ảnh thất bại. Vui lòng thử lại.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "File ảnh không được để trống");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Kích thước file vượt quá giới hạn 5 MB (hiện tại: %.2f MB)"
                            .formatted(file.getSize() / 1_048_576.0));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Chỉ hỗ trợ định dạng: JPEG, PNG, WebP, GIF");
        }
    }

    private String getExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            return switch (ext) {
                case "jpg", "jpeg" -> "jpg";
                case "png" -> "png";
                case "webp" -> "webp";
                case "gif" -> "gif";
                default -> "jpg";
            };
        }
        return "jpg";
    }
}