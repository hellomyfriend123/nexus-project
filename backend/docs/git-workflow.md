# GIT WORKFLOW — PROJECT NEXUS

> **Trạng thái: ĐỀ XUẤT (chưa được giảng viên/nhóm chính thức duyệt).** Áp dụng sau khi cả nhóm thống nhất. Cập nhật lại mục "đã duyệt" khi có quyết định chính thức.

## 1. Mô hình nhánh (Git Flow rút gọn)

| Nhánh | Mục đích | Quy tắc |
|---|---|---|
| `main` | Bản ổn định, chạy được, là nguồn để demo/nộp | Chỉ nhận từ `dev` qua Merge Request; không push trực tiếp |
| `dev` | Nhánh tích hợp hằng ngày của cả nhóm | Nhận từ các `feature/*`, `fix/*` qua MR |
| `feature/<mô-đảm>` | Mỗi tính năng / module | Ví dụ `feature/auction-bid`, `feature/catalog-search` |
| `fix/<mô tả>` | Sửa lỗi khẩn cấp | Tách từ `dev`, merge lại cả `dev` lẫn `main` nếu là lỗi trên `main` |

> Đề xuất: mỗi module nghiệp vụ (`user`, `catalog`, `fulfillment`, `commerce`, `auction`, `notification`) do **một người làm chủ** và mở MR riêng để giảm conflict giữa 3 backend.

## 2. Quy ước commit (Conventional Commits)

```
<loại>(<phạm vi>): <mô tả ngắn, thì hiện tại, tối đa ~72 ký tự>
```

| Loại | Dùng khi |
|---|---|
| `feat` | Thêm tính năng mới (gắn FR) — ví dụ `feat(catalog): FR-11 tìm kiếm sản phẩm theo tên` |
| `fix` | Sửa lỗi — ví dụ `fix(auction): bid REJECTED không bị rollback` |
| `docs` | Chỉ thay đổi tài liệu |
| `refactor` | Sửa cấu trúc, không đổi hành vi |
| `test` | Chỉ thêm/sửa test |
| `chore` | Cấu hình build, CI, docker... |

Quy tắc kèm theo:
- Một commit chỉ làm một việc (đừng gộp "sửa lỗi + thêm tính năng").
- Không commit file build (`target/`), `.env`, secret, `.m2repo/` (đã có `.gitignore`).

## 3. Quy trình Merge Request

1. Tạo nhánh từ `dev`: `git checkout dev && git pull && git checkout -b feature/xxx`.
2. Code → test cục bộ: `.\build.ps1` (chạy `mvn clean verify`).
3. Push nhánh, mở MR `feature/xxx → dev`.
4. **Ít nhất 1 người review** (không phải người viết), dùng checklist:
   - [ ] `mvn clean verify` xanh ở CI.
   - [ ] Không có `@ManyToOne/@OneToMany` xuyên module.
   - [ ] Không expose entity qua REST; list trả `PageResponse<T>`.
   - [ ] Không commit secret (`.env`, `JWT_SECRET`, password).
   - [ ] Controller có `@Tag` + `@Operation(summary="FR-xx …")` + `@PreAuthorize`.
5. Squash merge vào `dev`.

## 4. Quy tắc bảo mật (bắt buộc, không phải đề xuất)

- **TUYỆT ĐỐI KHÔNG** commit: `.env`, `application-secret.yml`, mật khẩu, `JWT_SECRET`, token, private key, credentials GitLab.
- Nếu lỡ commit secret → **đổi ngay secret đó** (chứ không chỉ xoá file), vì nó đã nằm trong lịch sử git.
- `JWT_SECRET` phải là chuỗi ngẫu nhiên ≥ 32 ký tự, khác nhau giữa dev và demo.

## 5. Definition of Done (đề xuất)

Một MR được coi là "xong" khi: build xanh · có unit test cho nghiệp vụ chính · không warning nghiêm trọng · đã review chéo · endpoint có Swagger đầy đủ · chạy được trên máy ít nhất 1 người khác.
