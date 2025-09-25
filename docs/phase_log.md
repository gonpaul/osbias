
## What we built (Phase 2)

- **Auth endpoints**: register, login, logout, me
  - Why: secure account lifecycle and enable session-based UX.

- **JWT + cookies** with header support
  - Why: secure, HTTP-only sessions; header auth enables Swagger/manual testing.

- **Protected routing (middleware)**
  - Why: prevent unauthenticated access to core app pages like `/`.

- **Redux session bootstrap**
  - Why: load user state on app start for consistent UI behavior.

- **Login/Register pages with UX polish**
  - Why: clear flows with loading states, redirects, and error handling.

- **Profile management**
  - Why: users can update name/email; foundation for personalization.

- **Password change**
  - Why: user-controlled security without admin intervention.

- **Preferences (DB + API)**
  - Why: persist user settings (theme, editor options) and set up extensibility.

- **Swagger with JWT security**
  - Why: documented, testable API with explicit public/protected routes.

- **Data model updates**
  - Why: `users.preferences` adds a flexible, evolvable settings surface.

### Net impact

- Secure, session-aware app ready for user-facing features.
- Clear API contract with auth semantics documented.
- Scalable groundwork (preferences, profile, header auth) for future roles and editor/AI phases.

### Key considerations and notes

- **Security**
  - Use a strong `JWT_SECRET` in production; rotate periodically.
  - Set cookies `httpOnly`, `secure` (prod), `sameSite=lax`.
  - Consider CSRF for state-changing endpoints if you add non-cookie auth later.
  - Add basic rate limiting on auth routes (login/register).
  - Enforce password policy (min length, complexity) and uniform error messages.

- **Auth semantics**
  - Token expiry is 7d; decide on refresh/rolling sessions vs hard expiry.
  - Add logout-all (token invalidation) if you implement refresh tokens.
  - Support Authorization header for Swagger/manual tests (already done).

- **Data ownership and roles (next)**
  - Add `users.role` and enforce ownership checks on user-scoped data.
  - Restrict system data mutations to `admin`; document in Swagger.

- **DB and migrations**
  - Ensure `users.email` unique constraint (exists).
  - `users.preferences` is TEXT (JSON); validate shape in API to avoid junk blobs.
  - Seed an initial admin user in dev.

- **API and Swagger**
  - Keep protected endpoints annotated with `security: [bearerAuth]`.
  - Keep public endpoints (`login`, `register`, `logout`) with `security: []`.

- **UX**
  - Redirect authenticated users away from `/login` and `/register` (done).
  - Add inline validation and disabled states (done); consider toasts.

- **Ops**
  - Add basic request logging and error tracing on auth routes.
  - Backups for SQLite (or plan migration to prod DB).
  - Monitor 401/403 rates to detect auth issues.

- **Testing**
  - Add a small end-to-end script: register → me → logout → me (401) → login → me.
  - Add API contract tests for 409 duplicate email and 401 invalid creds.