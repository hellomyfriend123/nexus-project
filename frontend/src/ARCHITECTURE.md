# Frontend architecture

- app/: application entry and route composition.
- roles/: buyer, seller and administrator layouts/routes and access guards.
- features/: business UI, hooks, feature-local services, types and tests.
- services/api/: shared authenticated HTTP client and catalog/commerce/buyer/header integrations.
- shared/: reusable components, safe rich-text rendering and styles.

Production pages use Backend APIs. Loading, empty, unavailable and error states must not fall back to fabricated business data. Static UI labels/options belong in constants/config modules; synthetic response data belongs only in test fixtures. Do not import test fixtures into runtime source.

Authentication uses the Backend login/register/profile/logout APIs. Google login redirects through the Backend OAuth endpoints and exchanges a single-use callback code; it requires server-side provider configuration. Never store passwords or provider secrets in Frontend. Sessions use localStorage or sessionStorage according to Remember me; the server remains authoritative for permissions.

API integration follows page/component → feature hook/service → shared API client. Preserve existing role and feature boundaries; do not scatter fetch calls through UI components. Backend controllers/DTOs/services are the contract source, not old demo documentation.

Run checks from the Frontend root: npm run typecheck, npm run build, npm run lint, and the Node test files. Unit/contract tests with stubbed fetch do not prove a live Backend works. Real verification needs a running Backend and appropriate test accounts, without exposing credentials in logs or reports.
