# PROJECT NEXUS

Monorepo của đồ án **Project Nexus** — marketplace thương mại điện tử kết hợp đấu giá (OJT Team 1, FPT University).

## Cấu trúc

```
project-nexus/
├── backend/          # Spring Boot 4.1.1 + Java 21 — 8 module Maven (microservice-style)
├── frontend/         # (chưa có source — sẽ bổ sung)
└── README.md
```

### `backend/`
- 1 ứng dụng Spring Boot (`nexus-app`) + 6 module nghiệp vụ + `nexus-common`
- Mỗi module một schema PostgreSQL riêng, không tham chiếu JPA chéo module
- Xem chi tiết: [`backend/README.md`](backend/README.md) và [`backend/CONVENTIONS.md`](backend/CONVENTIONS.md)

### `frontend/`
Chưa có mã nguồn. Sẽ bổ sung khi nhóm xác nhận framework và cung cấp source thật.

## Chạy backend

```powershell
cd backend
cp .env.example .env      # điền DB_URL / DB_USERNAME / DB_PASSWORD
.\build.ps1               # mvn clean verify
java -jar nexus-app\target\nexus-app-1.0.0-SNAPSHOT.jar
```

Swagger UI: <http://localhost:8080/swagger-ui.html>

## Chạy bằng Docker (backend)

```powershell
cd backend
cp .env.example .env
docker compose up --build
```

## Quy ước

Xem [`backend/CONVENTIONS.md`](backend/CONVENTIONS.md) — bắt buộc đọc trước khi viết code.
