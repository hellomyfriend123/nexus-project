# syntax=docker/dockerfile:1
# =====================================================================================
# PROJECT NEXUS — BACKEND (skeleton) — Dockerfile
# Multi-stage: build bằng Maven + JDK, chạy bằng JRE.
#
# LƯU Ý QUAN TRỌNG:
#   - Java version phải KHỚP với pom.xml (hiện skeleton đặt java.version = 25).
#     Nếu Docker Hub chưa có tag JDK 25, đổi 25 -> 21 ở CẢ HAI chỗ dưới đây
#     VÀ cập nhật java.version / maven.compiler.release trong pom.xml cho khớp.
#   - KHÔNG copy .env / secret vào image (xem .dockerignore).
#   - Không chạy migration phá hủy dữ liệu trong image; DDL do docker-compose nạp
#     một lần khi volume Postgres còn trống.
# =====================================================================================

# ---- 1) BUILD ----
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace

# Copy toàn bộ mã nguồn (parent POM + 8 module). .dockerignore loại target/.git/.env.
COPY . .

# Build toàn bộ reactor; bỏ test ở bước build image (CI/test chạy riêng).
RUN mvn -B -ntp -DskipTests package

# ---- 2) RUNTIME ----
FROM eclipse-temurin:25-jre
WORKDIR /app

# Chỉ copy jar chạy được duy nhất (nexus-app đã được spring-boot repackage).
COPY --from=build /workspace/nexus-app/target/nexus-app-*.jar /app/app.jar

EXPOSE 8080

# Cấu hình qua biến môi trường (DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET...)
# do docker-compose / môi trường chạy cung cấp — KHÔNG hard-code trong image.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
