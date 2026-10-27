package com.nexus.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình OpenAPI dùng chung. Swagger UI: {@code /swagger-ui.html}, JSON: {@code /v3/api-docs}.
 * Bấm "Authorize" và dán token lấy từ {@code POST /api/v1/auth/login} để gọi các API bảo vệ.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI nexusOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Project Nexus API")
                        .version("v1.0")
                        .description("""
                                Marketplace e-commerce kết hợp đấu giá — Project Nexus.
                                Hệ thống gồm 6 module nghiệp vụ: user, catalog, fulfillment, commerce, auction, notification.
                                Mọi API (trừ /api/v1/auth/**) yêu cầu header `Authorization: Bearer <token>`.
                                """)
                        .contact(new Contact().name("OJT Team 1"))
                        .license(new License().name("Học phần OJT — FPT University")))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("NexusToken")
                                .description("Token lấy từ POST /api/v1/auth/login")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}
