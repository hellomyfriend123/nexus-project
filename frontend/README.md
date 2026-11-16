# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Chạy frontend trên máy mới

Cài Node.js/npm trước, sau đó mở terminal tại thư mục gốc repository và chạy:

```sh
cd frontend
npm ci
npm run dev
```

Mở URL mà Vite hiển thị trong terminal (thường là `http://localhost:5173`). `npm ci` cài các thư viện theo `package-lock.json`; không cần cài thư viện thủ công.

Frontend mặc định gọi API tại `http://localhost:8080`. Nếu cần đổi địa chỉ backend, sao chép `.env.example` thành `.env.local`, cập nhật `VITE_API_BASE_URL`, rồi khởi động lại Vite. Backend cần được chạy và cho phép origin của frontend qua CORS.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Authentication API

Login and registration call the backend at `http://localhost:8080/api/v1/auth`. Copy `.env.example` to `.env.local` to change `VITE_API_BASE_URL` (the origin only, without `/api/v1/auth`), then restart Vite. The backend must allow the frontend origin via CORS. No proxy or mock authentication is enabled.

Login accepts email or username; phone login is not supported by the backend. Registration creates a BUYER or SELLER account and does not log in automatically. Google and forgotten-password flows remain unavailable.

Remember me uses localStorage; otherwise sessionStorage is used. Only the JWT, expiry and public profile are stored, never passwords. Expired sessions and authenticated 401 responses clear client state. JWTs are bearer credentials accessible to JavaScript: use HTTPS and an appropriate CSP in production. Backend logout is stateless (clearing a token does not revoke it server-side).

Run authentication regression tests with `node --test src/features/auth/tests/*.test.mjs`. These include mocked-fetch API contract tests; they do not substitute for a live backend integration test.
