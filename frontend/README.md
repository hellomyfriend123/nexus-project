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

Login and registration use the real `/api/v1/auth` endpoints. An empty `VITE_API_BASE_URL` uses the development Vite proxy to `API_PROXY_TARGET` (default `http://localhost:8080`). For deployment, set `VITE_API_BASE_URL` to the backend origin (without `/api/v1/auth`) and allow the frontend origin via backend CORS, or configure a same-origin reverse proxy. No mock authentication is enabled.

Login accepts email only; username and phone login are not supported by the backend. Registration creates a BUYER or SELLER account and does not log in automatically. Forgotten-password remains unavailable. Google sign-in navigates to the backend `/oauth2/authorization/google?role=BUYER|SELLER`; the `/oauth2/callback` route exchanges the one-time code through `POST /api/v1/auth/oauth2/exchange` and reuses the normal session handling. The callback removes its query string before exchange, rejects missing/malformed/duplicate parameters and requires tab-local sign-in intent. The backend enforces the code's 60-second lifetime and single use. A failed exchange requires restarting sign-in.

Google OAuth requires backend-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, `OAUTH2_FRONTEND_CALLBACK_URL` pointing to this frontend's `/oauth2/callback`, and the backend `/login/oauth2/code/google` redirect URI registered in Google Console. Never place the client secret in frontend environment variables. When using a same-origin proxy, forward `/api`, `/oauth2/authorization` and `/login/oauth2`; the frontend `/oauth2/callback` must remain an SPA route. The Vite development proxy already forwards those backend paths. There is no backend OAuth availability/status endpoint; missing backend credentials disable the provider and cannot be detected before navigating.

Remember me uses localStorage; otherwise sessionStorage is used. Only the bearer token, expiry and public profile are stored, never passwords. Expired sessions and authenticated 401 responses clear client state. Tokens are bearer credentials accessible to JavaScript: use HTTPS and an appropriate CSP in production. Backend logout is stateless (clearing a token does not revoke it server-side).

Run authentication regression tests with `node --test src/features/auth/tests/*.test.mjs`. These include mocked-fetch API contract tests; they do not substitute for a live backend integration test.
