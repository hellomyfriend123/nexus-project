package com.nexus.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/** Bật JPA auditing để {@code BaseEntity.createdAt/updatedAt} tự động có giá trị. */
@Configuration
@EnableJpaAuditing
public class AuditingConfig {
}
