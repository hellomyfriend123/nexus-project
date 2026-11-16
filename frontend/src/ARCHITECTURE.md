# Frontend architecture

- `app/`: application entry and route composition.
- `roles/{administrator,buyer,seller}/`: reserved role-specific UI; no role pages implemented yet.
- `features/auth/`: login UI, account-role types, mock authentication service.
- `shared/components/`: shared Header, Footer and SVG icon component. Header/Footer keep their existing JavaScript and colocated CSS.
- `services/api/`: reserved for separately requested REST integration; no HTTP client yet.
- `assets/images/`: raster images; `assets/icons/`: SVG assets. Existing unused starter assets are retained; no source code currently references them.
- `styles/`: future global styles; component-specific CSS stays beside its component.
- The former top-level `components/` directory is removed. Shared components belong in `shared/components/`; role-specific UI belongs in `roles/<role>/`, and business-specific components in `features/<feature>/`.

New code uses TypeScript. Existing JavaScript is supported through `allowJs` without a broad migration.

## Login desktop preview

Run `npm run dev`, then visit `/login`. Existing non-login routes keep their original shell.

Mock fixtures (public development data, not real credentials):

- Identifier: `nguyen.minh@nexus.vn`, `nguyen.minh`, or `0901234567`.
- Correct password: `NexusSecurePass2025` → inline mock-success message; no authenticated session.
- Known identifier + another password → incorrect-password design.
- Another identifier → account-not-found design.
- Empty fields → client-side required validation.

Both buyer and seller use the same mock fixtures. The remember option is UI-only and does not persist credentials. The retry count and lockout wording reproduce the supplied static design; no security or lockout is implemented.

Register is awaiting design. Create-account, password-recovery and Google buttons show placeholder notices, with no navigation or external requests. No mobile layout is defined in this desktop-only task. Font assets were not supplied, so Segoe UI / Arial are temporary system-font fallbacks.

Checks: `npm run build`, `npm run typecheck`, `npm run lint`.
