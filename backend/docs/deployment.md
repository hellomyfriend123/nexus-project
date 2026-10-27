# DEPLOYMENT & VẬN HÀNH — PROJECT NEXUS BACKEND

> Ghi rõ trạng thái xác minh: các mục Docker/CI ở đây là **cấu hình đã viết nhưng CHƯA chạy xác minh**
> trên máy hiện tại (máy không cài Docker). Build/test Maven thì đã xác minh (`mvn clean verify`).

## 1. Các cách chạy

| Cách | Khi nào dùng | Lệnh |
|---|---|---|
| Build + test | Mọi thay đổi | `cd backend && .\build.ps1` (tương đương `mvn clean verify`) |
| Chạy jar | Máy có Java + DB sẵn | `java -jar nexus-app\target\nexus-app-1.0.0-SNAPSHOT.jar` |
| Docker Compose | Chạy cả DB + app tách biệt, sạch | `docker compose up --build` |
| CI (GitLab) | Tự động mỗi push | xem `.gitlab-ci.yml` |

## 2. Biến môi trường

Copy `.env.example` → `.env`, điền giá trị thật. Bảng đầy đủ:

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DB_URL` | ✅ | JDBC URL. Với Supabase dùng **Session Pooler (cổng 5432)**, KHÔNG dùng URL dashboard |
| `DB_USERNAME` / `DB_PASSWORD` | ✅ | Thông tin đăng nhập DB |
| `DB_NAME` | docker | Tên database (dùng trong compose) |
| `DDL_AUTO` | tùy chọn | `update` (dev) / `validate` (DB chung, demo) |
| `JWT_SECRET` | ✅ (deploy) | Chuỗi ký token, ≥ 32 ký tự |
| `CORS_ALLOWED_ORIGINS` | tùy chọn | Origin của Frontend |
| `SERVER_PORT` | tùy chọn | mặc định 8080 |

## 3. Supabase (môi trường chung / demo)

1. Tạo project trên Supabase → lấy connection string dạng **Session Pooler** (host `...pooler.supabase.com`, cổng `5432`).
2. Chạy các script DDL để tạo schema/bảng (chạy đúng thứ tự):
   ```
   psql "$DB_URL" -f db/00-create-schemas.sql -f db/01-user.sql ... -f db/99-seed.sql
   ```
3. Đặt `DDL_AUTO=validate` — Hibernate chỉ **kiểm tra** schema, không tự sửa.
4. Cảnh báo RLS: schema `public` của Supabase bị expose qua Data API — mọi bảng của Nexus nằm trong schema riêng (`nexus_*`), KHÔNG đặt vào `public`.

## 4. Docker

```powershell
cp .env.example .env          # điền giá trị
docker compose up --build     # Postgres + app, healthcheck, tự nạp DDL lần đầu
```

- **Không bake secret:** image chỉ chứa jar + JRE; cấu hình qua env lúc chạy.
- **Không migration phá hủy:** `db/*.sql` chạy bởi postgres entrypoint **chỉ khi volume trống lần đầu**, và mọi script dùng `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`.
- **CHƯA XÁC MINH:** máy review không có Docker nên chưa build/chạy thử image. Cần chạy lại trên máy có Docker trước khi tuyên bố thành công.

## 5. GitLab CI (`.gitlab-ci.yml`)

Pipeline hiện có 3 job an toàn, không cần secret:
`compile` (mvn -DskipTests compile) → `unit-test` (mvn test) → `package` (mvn -DskipTests package, lưu jar artifact).

Chưa bật (chờ điều kiện):
- **docker-build** — cần runner hỗ trợ Docker-in-Docker.
- **push registry** — cần xác minh quyền truy cập GitLab Container Registry + credentials (không in secret vào log).

## 6. Luồng deploy (đề xuất, chưa duyệt)

```
push feature → CI compile+test → MR → merge dev → CI → (khi có runner Docker) build image
→ (khi có môi trường + secret + quy trình rollback được duyệt) deploy demo
```

KHÔNG tự động deploy production khi chưa có môi trường, secret và quy trình rollback được giảng viên duyệt.
