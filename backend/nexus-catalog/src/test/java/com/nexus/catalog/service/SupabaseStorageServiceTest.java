package com.nexus.catalog.service;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Unit test cho {@link SupabaseStorageService} — xác thực validation và tích hợp RestClient qua {@link MockRestServiceServer}.
 */
@ExtendWith(MockitoExtension.class)
class SupabaseStorageServiceTest {

    private static final String SUPABASE_URL = "https://test.supabase.co";
    private static final String BUCKET = "product-images";

    private MockRestServiceServer mockServer;
    private SupabaseStorageService storageService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(SUPABASE_URL + "/storage/v1/object");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        storageService = new SupabaseStorageService(SUPABASE_URL, BUCKET, restClient);
    }

    // ------------------------------------------------------------------ Validation Tests

    @Test
    @DisplayName("Validation: file null → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_fileNull_nemBadRequest() {
        UUID productId = UUID.randomUUID();

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, null))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("File ảnh không được để trống");
                });
    }

    @Test
    @DisplayName("Validation: file rỗng → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_fileRong_nemBadRequest() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, emptyFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("File ảnh không được để trống");
                });
    }

    @Test
    @DisplayName("Validation: file vượt quá 5MB → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_fileQuaKichThuoc5MB_nemBadRequest() {
        UUID productId = UUID.randomUUID();
        byte[] oversizedContent = new byte[(5 * 1024 * 1024) + 1]; // 5MB + 1 byte
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.png", "image/png", oversizedContent);

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, largeFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("Kích thước file vượt quá giới hạn 5 MB");
                });
    }

    @Test
    @DisplayName("Validation: định dạng file không được hỗ trợ (PDF) → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_dinhDangPdfKhongHopLe_nemBadRequest() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile pdfFile = new MockMultipartFile("file", "doc.pdf", "application/pdf", "dummy pdf".getBytes());

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, pdfFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("Chỉ hỗ trợ định dạng: JPEG, PNG, WebP, GIF");
                });
    }

    @Test
    @DisplayName("Validation: định dạng file text/plain → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_dinhDangTextKhongHopLe_nemBadRequest() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile textFile = new MockMultipartFile("file", "script.sh", "text/plain", "echo hi".getBytes());

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, textFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("Chỉ hỗ trợ định dạng: JPEG, PNG, WebP, GIF");
                });
    }

    @Test
    @DisplayName("Validation: contentType null → ném BusinessException(BAD_REQUEST)")
    void uploadProductImage_contentTypeNull_nemBadRequest() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile noContentTypeFile = new MockMultipartFile("file", "image.jpg", null, "bytes".getBytes());

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, noContentTypeFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(be.getMessage()).contains("Chỉ hỗ trợ định dạng");
                });
    }

    // ------------------------------------------------------------------ Success Upload Tests

    @Test
    @DisplayName("Upload: ảnh JPEG hợp lệ → gửi PUT lên Supabase và trả về publicUrl chuẩn")
    void uploadProductImage_jpegHopLe_traVePublicUrlChuan() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile jpegFile = new MockMultipartFile(
                "file", "avatar.jpeg", MediaType.IMAGE_JPEG_VALUE, "fake-jpeg-data".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess());

        String publicUrl = storageService.uploadProductImage(productId, jpegFile);

        mockServer.verify();
        assertThat(publicUrl)
                .startsWith(SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/products/" + productId + "/")
                .endsWith(".jpg");
    }

    @Test
    @DisplayName("Upload: ảnh PNG hợp lệ → lưu với đuôi .png và trả về publicUrl")
    void uploadProductImage_pngHopLe_traVePublicUrlVoiExtensionPng() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile pngFile = new MockMultipartFile(
                "file", "product.png", MediaType.IMAGE_PNG_VALUE, "fake-png-data".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess());

        String publicUrl = storageService.uploadProductImage(productId, pngFile);

        mockServer.verify();
        assertThat(publicUrl)
                .startsWith(SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/products/" + productId + "/")
                .endsWith(".png");
    }

    @Test
    @DisplayName("Upload: ảnh WebP hợp lệ → lưu với đuôi .webp và trả về publicUrl")
    void uploadProductImage_webpHopLe_traVePublicUrlVoiExtensionWebp() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile webpFile = new MockMultipartFile(
                "file", "banner.webp", "image/webp", "fake-webp-data".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess());

        String publicUrl = storageService.uploadProductImage(productId, webpFile);

        mockServer.verify();
        assertThat(publicUrl)
                .startsWith(SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/products/" + productId + "/")
                .endsWith(".webp");
    }

    @Test
    @DisplayName("Upload: ảnh GIF hợp lệ → lưu với đuôi .gif và trả về publicUrl")
    void uploadProductImage_gifHopLe_traVePublicUrlVoiExtensionGif() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile gifFile = new MockMultipartFile(
                "file", "animation.gif", MediaType.IMAGE_GIF_VALUE, "fake-gif-data".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess());

        String publicUrl = storageService.uploadProductImage(productId, gifFile);

        mockServer.verify();
        assertThat(publicUrl)
                .startsWith(SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/products/" + productId + "/")
                .endsWith(".gif");
    }

    @Test
    @DisplayName("Upload: filename không có extension → mặc định dùng đuôi .jpg")
    void uploadProductImage_filenameKhongCoExtension_macDinhDungJpg() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile noExtFile = new MockMultipartFile(
                "file", "imageWithoutExt", MediaType.IMAGE_JPEG_VALUE, "raw-bytes".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess());

        String publicUrl = storageService.uploadProductImage(productId, noExtFile);

        mockServer.verify();
        assertThat(publicUrl).endsWith(".jpg");
    }

    // ------------------------------------------------------------------ Error Handling Tests

    @Test
    @DisplayName("Lỗi mạng/Supabase: Supabase trả lỗi 500 → ném BusinessException(INTERNAL_ERROR)")
    void uploadProductImage_supabaseTraVeLoiServer_nemInternalError() {
        UUID productId = UUID.randomUUID();
        MockMultipartFile jpegFile = new MockMultipartFile(
                "file", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "bytes".getBytes());

        mockServer.expect(requestTo(startsWith(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/products/" + productId)))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withServerError());

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, jpegFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.INTERNAL_ERROR);
                    assertThat(be.getMessage()).contains("Upload ảnh thất bại. Vui lòng thử lại.");
                });
    }

    @Test
    @DisplayName("Lỗi đọc dữ liệu: file.getBytes() ném IOException → ném BusinessException(INTERNAL_ERROR)")
    void uploadProductImage_fileDocLoiIOException_nemInternalError() throws Exception {
        UUID productId = UUID.randomUUID();
        MultipartFile failingFile = mock(MultipartFile.class);
        given(failingFile.isEmpty()).willReturn(false);
        given(failingFile.getSize()).willReturn(1024L);
        given(failingFile.getContentType()).willReturn("image/jpeg");
        given(failingFile.getOriginalFilename()).willReturn("corrupted.jpg");
        given(failingFile.getBytes()).willThrow(new IOException("Disk I/O failure"));

        assertThatThrownBy(() -> storageService.uploadProductImage(productId, failingFile))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assertThat(be.getErrorCode()).isEqualTo(ErrorCode.INTERNAL_ERROR);
                    assertThat(be.getMessage()).contains("Không thể đọc dữ liệu file");
                });
    }
}
