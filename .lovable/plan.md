

# Security Audit Report — Crimson Marketplace

## Overall Assessment: **Reasonably Secure** with a few targeted fixes needed

The application uses the Supabase SDK (parameterized queries, RLS enforcement), proper auth patterns, and avoids most common pitfalls. Below are the findings ordered by severity.

---

## Finding 1 — Hardcoded Signup Key in Client-Side Code

- **Severity:** High
- **Location:** `src/pages/Auth.tsx`, line 10
- **The Exploit:** The signup key `GCSAHIWAL04` is embedded in the JavaScript bundle. Any user can open DevTools → Sources, search for it, and bypass the registration gate entirely.
- **The Fix:** Move signup key validation to the backend. Create a database function or edge function that verifies the key server-side during registration. The client sends the key to the backend, and the backend validates it before allowing the `auth.signUp` call to proceed. Alternatively, store the key as a secret and validate in a database trigger on profile creation.

---

## Finding 2 — Hardcoded Admin Phone Number (PII Exposure)

- **Severity:** Medium
- **Location:** `src/pages/ProductDetail.tsx` line 14, `src/pages/Cart.tsx` line 12, `src/pages/Settings.tsx` lines 431/439
- **The Exploit:** The admin's personal WhatsApp number (`03126203644` / `923126203644`) is in the client bundle, visible to anyone. This is PII leakage.
- **The Fix:** Store the admin contact number in a database settings/config table (e.g., `app_settings`) and fetch it at runtime. This way it's not baked into the JS bundle and can be changed without a redeploy.

---

## Finding 3 — Admin Route Protection is Client-Side Only

- **Severity:** Medium
- **Location:** `src/pages/Admin.tsx`, lines 36-39
- **The Exploit:** The admin page redirects non-admins via `useEffect`, but all admin data queries (pending products, rejected products, stats) fire immediately on mount regardless. RLS policies on the `products` table do gate data server-side (admins have a separate SELECT policy), so actual data leakage is prevented by RLS. However, the admin UI itself is in the client bundle and visible.
- **The Fix:** No critical data leak due to RLS. However, to harden: (1) ensure the admin queries don't fire until `isAdmin` is confirmed by adding `enabled: isAdmin` to the `usePendingProducts`, `useRejectedProducts` hooks when used on the admin page, and (2) consider lazy-loading the Admin route so the code isn't in the main bundle.

---

## Finding 4 — No Input Length Validation on Forms

- **Severity:** Medium
- **Location:** `src/pages/Sell.tsx` (title, description, contact fields), `src/pages/Auth.tsx` (username)
- **The Exploit:** Users can submit extremely long strings (megabytes of text) in title, description, or contact fields. This could bloat the database and cause UI rendering issues.
- **The Fix:** Add `maxLength` attributes to input fields and validate lengths before submission:
  - Title: max 200 characters
  - Description: max 5000 characters
  - Contact: max 100 characters
  - Username: already validated (3-20 chars) in Auth.tsx

---

## Finding 5 — No File Upload Validation (Type/Size)

- **Severity:** Medium
- **Location:** `src/pages/Sell.tsx` line 62-72, `src/pages/Settings.tsx` line 47-57
- **The Exploit:** The `accept="image/*"` attribute is client-side only. An attacker can upload non-image files or very large files (100MB+) by modifying the request, consuming storage quota.
- **The Fix:** Add client-side file size validation (e.g., max 5MB) before upload. Also configure storage bucket policies in the backend to reject files over a size limit and restrict MIME types.

---

## Finding 6 — No Rate Limiting on Auth Endpoints

- **Severity:** Medium
- **Location:** `src/pages/Auth.tsx` (signIn/signUp), `src/pages/Settings.tsx` (password reset)
- **The Exploit:** An attacker can brute-force login credentials or spam password reset emails. Supabase has built-in rate limiting on auth endpoints (default: ~30 requests/hour for signup, stricter for password reset), but there's no client-side throttling or CAPTCHA.
- **The Fix:** Add client-side debouncing (disable the button for 30s after 3 failed attempts). For production, consider enabling CAPTCHA in the auth settings. Supabase's built-in rate limiting provides a baseline defense.

---

## Finding 7 — `.env` Not in `.gitignore`

- **Severity:** Low
- **Location:** `.gitignore`
- **The Exploit:** The `.env` file contains `VITE_SUPABASE_URL` and the anon key. While these are *publishable* keys (designed to be public), it's still best practice to gitignore `.env` files to prevent accidental inclusion of future secrets.
- **The Fix:** Add `.env` and `.env.*` to `.gitignore`. Note: in this Lovable Cloud project, the `.env` is auto-generated and only contains public keys, so this is low risk.

---

## Finding 8 — Error Messages May Leak Internal Details

- **Severity:** Low
- **Location:** `src/pages/Sell.tsx` line 139, `src/pages/Settings.tsx` line 97, `src/pages/Admin.tsx` lines 76/91
- **The Exploit:** `error.message` from Supabase is displayed directly in toast notifications. Some Supabase errors can contain table names, constraint names, or policy details.
- **The Fix:** Replace raw `error.message` with generic user-facing messages. Log the actual error to a monitoring service instead:
  ```typescript
  // Instead of: description: error.message
  description: "Something went wrong. Please try again."
  ```

---

## Secure Patterns Already in Place

1. **SQL Injection:** Not applicable — the Supabase JS SDK uses parameterized queries internally. No raw SQL is constructed in client code.
2. **XSS:** No `dangerouslySetInnerHTML` with user content (only in the chart.tsx UI library component with static theme data). User-provided text is rendered via React's built-in JSX escaping.
3. **Authentication:** Uses `onAuthStateChange` listener set up before `getSession()` — correct pattern. Sessions use Supabase's secure JWT handling with `HttpOnly` refresh tokens.
4. **RLS:** Comprehensive policies on all tables — users can only CRUD their own data, admins have elevated access via `SECURITY DEFINER` function, public can only view approved products.
5. **Admin role check:** Uses server-side `has_role()` SECURITY DEFINER function — not stored in localStorage or client state for authorization decisions. The client-side `isAdmin` state is only for UI rendering.
6. **CSRF:** SPA architecture with JWT Bearer tokens (not cookies) makes CSRF attacks non-applicable.

---

## Implementation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 | Move signup key validation server-side | Medium |
| 2 | Add file upload size/type validation | Low |
| 3 | Add input length limits | Low |
| 4 | Move admin phone to database config | Low |
| 5 | Sanitize error messages | Low |
| 6 | Add `.env` to `.gitignore` | Trivial |
| 7 | Add client-side rate limiting on auth | Low |
| 8 | Lazy-load admin route | Low |

Would you like me to implement these fixes?

