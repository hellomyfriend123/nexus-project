# =====================================================================================
# PROJECT NEXUS — BACKEND IMAGE
# Đa tầng (multi-stage): build bằng Maven + JDK 21, chạy bằng JRE 21.
#
# LƯU Ý BẢO MẬT:
#   - Không COPY .env hay bất kỳ secret nào vào image (xem .dockerignore).
#   - Không chạy migration phá hủy dữ liệu ở đây: DDL được nạp an toàn bởi
#     docker-compose (postgres entrypoint init, chỉ chạy khi volume trống lần đầu).
# =====================================================================================

# ---- 1) BUILD ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy toàn bộ mã nguồn (parent POM + 8 module). .dockerignore loại target/.git/.env.
COPY . .

# Build toàn bộ reactor; bỏ test vì CI chạy test ở stage riêng.
# Không cần database để build (các test là unit test thuần Mockito, không @SpringBootTest).
RUN mvn -B -ntp -DskipTests package

# ---- 2) RUNTIME ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Chỉ copy jar chạy được duy nhất (nexus-app đã được spring-boot repackage).
COPY --from=build /workspace/nexus-app/target/nexus-app-*.jar /app/app.jar

EXPOSE 8080

# Cấu hình qua biến môi trường (DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET...)
# do docker-compose / môi trường chạy cung cấp — KHÔNG hard-code ở đây.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
