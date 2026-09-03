# Environment variable checklist

Every `process.env.*` (backend) and `import.meta.env.VITE_*` (frontend) reference
in the codebase, whether it's required, and how the code behaves if it's missing.

Legend for **If missing**:
- 🟥 **fail-fast** — process exits at boot / build fails, with a message naming the var
- 🟩 **safe default** — documented fallback, app keeps working
- 🟨 **degraded** — feature turns off cleanly, rest of app fine
- 🟧 **ambiguous failure** — 500s or silently breaks with no clear pointer *(none of these remain after this change)*

---

## Backend — set in **Render → your service → Environment**

### Required (boot refuses to start without these — `config/requiredEnv.js`)

| Variable | Purpose | If missing | Set on Render? |
|---|---|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (includes db name + credentials) | 🟥 fail-fast | ☐ |
| `ADMIN_JWT_SECRET` | Signs admin/dashboard JWTs | 🟥 fail-fast | ☐ |
| `TOURIST_JWT_SECRET` | Signs tourist JWTs (Google sign-in, saved itineraries) | 🟥 fail-fast | ☐ |
| `JWT_SECRET` | Signs owner-account JWTs (`/auth/register`, `/auth/login`) | 🟥 fail-fast | ☐ |

> Generate each secret with `openssl rand -base64 48`. **Use three different
> values** — boot warns if any two match. Boot also warns if any is < 16 chars.

### Required for first boot only (seeds the first admin — `utils/bootstrapAdmin.js`)

| Variable | Purpose | If missing | Set on Render? |
|---|---|---|---|
| `ADMIN_EMAIL` | Email of the first owner account | 🟨 logs a clear error, seeds nothing (fine once an admin exists — then delete it) | ☐ |
| `ADMIN_PASSWORD_HASH` | **bcrypt hash** (starts `$2`) of that owner's password — never the plaintext | 🟨 same; also rejected with a clear message if it's not a `$2…` hash | ☐ |

> Only consulted while the `adminusers` collection is empty. After you've logged
> in once and (optionally) created more admins, these can be removed from Render.
> Alternative: `node scripts/createAdmin.js <email>` against the prod `MONGO_URI`.

### Optional integrations (boot logs which are off; each degrades cleanly)

| Variable | Feature | If missing | Set on Render? |
|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Admin image uploads | 🟨 upload routes return `503` with a clear message; review-image URLs rejected | ☐ |
| `CLOUDINARY_API_KEY` | Admin image uploads | 🟨 same | ☐ |
| `CLOUDINARY_API_SECRET` | Admin image uploads | 🟨 same | ☐ |
| `GROQ_API_KEY` | AI guide chat + AI itineraries | 🟨 chat returns `503`; itinerary falls back to the local generator | ☐ |
| `GROQ_MODEL` | Override the Groq chat model | 🟩 defaults to `openai/gpt-oss-120b` | ☐ (optional) |
| `GOOGLE_CLIENT_ID` | Verifies Google ID tokens for tourist sign-in | 🟨 `/tourist/google` returns `401 "Invalid Google credential"` | ☐ |

> All three must be set the same as the values the frontend `VITE_*` equivalents
> point at (Cloudinary cloud name; Google client id).

### Tuning (safe defaults, only set if you need to change them)

| Variable | Purpose | Default | Set on Render? |
|---|---|---|---|
| `NODE_ENV` | `development` relaxes HTTPS/CORS/error-detail/visibility; anything else = production behaviour | production behaviour if unset (boot warns) — **set to `production`** | ☐ |
| `PORT` | Listen port | `5000` (Render sets this automatically) | ☐ (Render-managed) |
| `TRUST_PROXY_HOPS` | Number of proxies in front of the app | `1` (correct for Render; only set to `2` if you add Cloudflare in front) | ☐ (leave unset) |
| `MONGO_MAX_POOL_SIZE` | Mongo connection pool ceiling per worker | `8` | ☐ (optional) |
| `MONGO_MIN_POOL_SIZE` | Mongo connection pool floor per worker | `2` | ☐ (optional) |

---

## Frontend — set in **Vercel → Project → Settings → Environment Variables** (Production **and** Preview)

| Variable | Purpose | If missing | Set on Vercel? |
|---|---|---|---|
| `VITE_API_BASE_URL` | Backend API origin **including `/api/v1`, no trailing slash** — e.g. `https://<service>.onrender.com/api/v1` | 🟥 `vite build` fails; dev server throws on load | ☐ Production ☐ Preview |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client id for tourist sign-in (same id as backend `GOOGLE_CLIENT_ID`) | 🟥 `vite build` fails *(guard added — was previously a silent no-op sign-in button)* | ☐ Production ☐ Preview |

### Frontend build-time only (CI / deploy env, not baked into the bundle)

| Variable | Purpose | If missing | Set where? |
|---|---|---|---|
| `SITEMAP_API_BASE_URL` | API origin the `prebuild` sitemap generator crawls; falls back to `VITE_API_BASE_URL` | 🟩 falls back; if neither is set, only static routes are written (warned) | ☐ Vercel (optional — set = `VITE_API_BASE_URL` unless the API is elsewhere) |

### Built-in (do not set)

| Reference | Notes |
|---|---|
| `import.meta.env.DEV` | Vite built-in; `true` in dev, `false` in prod builds. Used by `ErrorBoundary` to show stack traces only in dev. |

---

## Cross-checks before going live

- [ ] Backend boot log shows `Environment check passed — all required variables are set.`
- [ ] Backend boot log shows `trust proxy = 1 hop(s)`
- [ ] Backend boot log has **no** `Optional integrations not configured` line for a feature you actually want (Cloudinary / Groq / Google)
- [ ] `GET https://<service>.onrender.com/health` → `nodeEnv: "production"` and `configured: { cloudinary: true, groq: true, google: true }` (for whichever you enabled)
- [ ] `GOOGLE_CLIENT_ID` (Render) === `VITE_GOOGLE_CLIENT_ID` (Vercel)
- [ ] `CLOUDINARY_CLOUD_NAME` (Render) matches the Cloudinary account the frontend expects
- [ ] `VITE_API_BASE_URL` (Vercel) points at the Render URL and ends in `/api/v1`
- [ ] The Render URL is in the CORS allowlist? No — CORS is keyed on the **frontend** origin (`trugoa.in`, `www.trugoa.in`) in `server.js`; confirm those match your real domain
- [ ] Google OAuth console → Authorized JavaScript origins includes every frontend origin (`https://trugoa.in`, `https://www.trugoa.in`, `http://localhost:5173`)
