package com.nexus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Điểm khởi động duy nhất của Project Nexus.
 * <p>
 * Class này cố tình đặt ở package gốc {@code com.nexus} để Spring Boot tự động quét
 * toàn bộ {@code com.nexus.**} — tức là mọi module nghiệp vụ (user, catalog, fulfillment,
 * commerce, auction, notification) mà không cần cấu hình {@code scanBasePackages}.
 * <p>
 * {@code @EnableScheduling} phục vụ FR-33/FR-34 (auction tự chuyển trạng thái theo thời gian).
 */
@SpringBootApplication
@EnableScheduling
public class NexusApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(NexusApplication.class, args);
    }

    private static void loadDotenv() {
        java.io.File[] candidates = new java.io.File[] {
                new java.io.File(".env"),
                new java.io.File("backend/.env"),
                new java.io.File("../.env")
        };

        for (java.io.File file : candidates) {
            if (file.exists() && file.isFile()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.FileReader(file, java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                                (val.startsWith("'") && val.endsWith("'"))) {
                                if (val.length() >= 2) {
                                    val = val.substring(1, val.length() - 1);
                                }
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    System.out.println("[NexusApplication] Đã nạp cấu hình từ: " + file.getAbsolutePath());
                    break;
                } catch (java.io.IOException e) {
                    System.err.println("[NexusApplication] Lỗi đọc .env: " + e.getMessage());
                }
            }
        }
    }
}
