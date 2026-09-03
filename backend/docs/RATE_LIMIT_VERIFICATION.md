# Rate limiting — verification (`trust proxy` + shared store across workers)

Two independent things have to be right for rate limiting to actually work here:

1. **`trust proxy`** — the limiter must key on the real client IP, not the proxy's.
2. **The store must be shared across worker processes** — `cluster.js` forks one
   worker per CPU, and the default in-memory store lives inside a single process,
   so each worker was counting separately and the effective limit was
   roughly `configured × workers`.

---

## What changed

| File | Change |
|---|---|
| `server.js` | `trust proxy` is `TRUST_PROXY_HOPS` (default `1`, bad value → `1`), logged at boot. `/health` now returns `pid` so you can see which worker answered. |
| `middleware/rateLimitStore.js` | **new** — a MongoDB-backed `express-rate-limit` store using the existing mongoose connection. No new service, no new npm dependency. |
| `middleware/rateLimiter.js` | all **9** limiters (`burst`, `health`, `api`, `auth`, `admin-login`, `ai`, `review`, `contact`, `itinerary`) now pass `store: createMongoStore("<name>")`. None override `keyGenerator`, so they still key on `req.ip`. |

Counters live in one collection, `ratelimits`, one document per limiter+client:

```
{ _id: "ai:203.0.113.5", count: 7, expiresAt: 2026-09-03T11:00:00Z }
```

A TTL index (`ratelimit_ttl` on `expiresAt`, `expireAfterSeconds: 0`) reaps closed
windows. The window is still enforced logically in the query, so the TTL reaper
lagging by up to a minute doesn't matter.

**Fail-open:** if MongoDB is unreachable the store logs a throttled warning and
lets the request through (returns a single hit) rather than 500-ing every
request. When Mongo is down every route is already failing, so this only changes
which error you see.

**Cost:** `burstLimiter` and `apiLimiter` run on every API request, so each API
request now does ~2 small indexed `findOneAndUpdate` upserts against Mongo. Fine
at launch traffic on Atlas. If that ever shows up in latency, the cheapest change
is to move only `burst`/`health`/`api` back to the in-memory store (they're
DoS-blunting guards where `×workers` slack is acceptable) and keep the shared
store on the strict low-count limiters (`auth`, `admin-login`, `ai`, `itinerary`,
`review`, `contact`) — those are the ones where `×workers` is the difference
between "5 login attempts" and "40".

---

## 1. How many workers, and where

`npm start` runs `cluster.js` (multi-worker); `npm run dev` runs `server.js`
directly (single process, no cluster — unaffected by any of this).

`backend/cluster.js` resolves the worker count in this order:

1. **`WEB_CONCURRENCY`** env var, if set to a positive integer — always wins.
2. else **`os.cpus().length`**.
3. else **`1`**.

**Why `WEB_CONCURRENCY` matters:** `os.cpus().length` inside a container commonly
reports the HOST machine's core count, not your instance's CPU allocation. On a
Render Free instance (a fraction of one core) the unpinned fallback forks many
workers that fight for the scheduler, and each opens its own MongoDB pool
(`MONGO_MAX_POOL_SIZE` default 8 × workers connections). Pin it to the plan:

| Plan | Set `WEB_CONCURRENCY` to |
|---|---|
| **Render Free** (shared, fraction of a core) | **`1`** |
| Render Starter (~0.5 CPU) | `1` (try `2` only if you measure a benefit) |
| Render Standard (1 CPU) | `2` |
| Dedicated-CPU plans | up to the vCPU count |

Set it in Render → your service → **Environment** → *Add Environment Variable*:
`WEB_CONCURRENCY` = `1`.

Confirm in the Render deploy logs after redeploying:

```
Primary process 1 — forking 1 worker(s) (WEB_CONCURRENCY)
Worker … started
```

If it logs `(os.cpus()=N)` instead of `(WEB_CONCURRENCY)`, the variable isn't set
or isn't a positive integer.

> With one worker the shared rate-limit store still works identically — it just
> isn't doing anything a per-process store wouldn't. It becomes load-bearing the
> moment you scale to 2+ workers, or run more than one instance. One worker under
> `cluster.js` still gets the automatic crash-restart (`cluster.on("exit")`).

---

## 2. Verify the limit holds across workers

### Automated

```bash
cd backend
node scripts/check-rate-limit.mjs https://<your-service>.onrender.com
```

- **Check 1 (clustering):** hits `/health` and collects distinct `pid` values.
  Seeing >1 pid proves the cluster is live and load is distributed.
- **Check 2 (cross-worker limit):** fires 50 concurrent requests at
  `/api/v1/businesses` (burst limit 30/10s). Passes if ~30 are allowed and the
  rest get `429` — i.e. the limit held at its configured value regardless of
  which worker answered. If **all 50** are allowed with multiple workers, the
  store is still per-process.
- **Check 3 (trust proxy):** see section 3 below.

> **Windows localhost caveat:** Node's cluster on Windows (`SCHED_NONE`) sends
> almost all local connections to a single worker, so Check 1 will report "one
> worker" even under `npm start` with 12 cores. Linux/Render uses round-robin
> (`SCHED_RR`), so run the real check against the deployed URL. Locally, use the
> direct DB check below instead.

### Direct — inspect the shared counter (definitive, any OS)

With the server running (`npm start`) and `MONGO_URI` pointing at the same DB:

```bash
# fire a flood
seq 1 50 | xargs -P 50 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:5000/api/v1/businesses | sort | uniq -c
#   -> expect ~30 "200" and ~20 "429"

# the count is in MongoDB, not in any worker's memory:
mongosh "$MONGO_URI" --quiet --eval 'db.ratelimits.find().toArray()'
#   -> { _id: "burst:<ip>", count: 50, expiresAt: ... }
#      { _id: "api:<ip>",   count: 30, expiresAt: ... }
```

If the `ratelimits` collection fills up as you send requests, and the flood caps
at ~30 rather than ~30×workers, the shared store is working. Verified this way on
a local 12-worker cluster: 50 concurrent → exactly 30 allowed / 20 rejected, with
`ratelimits` holding the shared count.

---

## 3. Verify `trust proxy` (real client IP, not a client header)

### Why `1` is correct for Render

Render serves every web service from behind **one** edge load balancer that
terminates TLS and appends the client IP as the **right-most** `X-Forwarded-For`
entry.

| `trust proxy` | `req.ip` becomes | Result |
|---|---|---|
| `1` | right-most XFF entry (client IP Render recorded) | ✅ per-user buckets, header spoofing ignored |
| `true` | left-most XFF entry (client-controlled) | ❌ spoof the header → unlimited fresh buckets; express-rate-limit throws `ERR_ERL_PERMISSIVE_TRUST_PROXY` |
| `false` | LB internal IP (same for everyone) | ❌ all users share one bucket |

Set `TRUST_PROXY_HOPS=2` **only** if you later add Cloudflare in front of Render.
Vercel is the frontend host and never proxies API calls, so it is not a hop.

### Check 3a — the script (from one machine)

`node scripts/check-rate-limit.mjs https://<your-service>.onrender.com` — the
trust-proxy section fires 6 plain requests, then 6 with a forged
`X-Forwarded-For: 203.0.113.7`. On the deployed server the forged header must be
ignored (the same bucket keeps draining). `✗ FAIL` here → `trust proxy` is too
permissive; unset `TRUST_PROXY_HOPS` (or set `1`) on Render and redeploy.

> Locally there's no proxy, so the forged header legitimately becomes `req.ip`
> and the script says "EXPECTED on localhost". Only the deployed run is meaningful.

### Check 3b — two real IPs (definitive)

1. **Device A** (laptop on wifi) — exhaust the general limiter:
   ```bash
   for i in $(seq 1 105); do \
     curl -s -o /dev/null -w "%{http_code} " https://<svc>.onrender.com/api/v1/businesses; \
   done; echo
   ```
   Last responses should be `429`.
2. **Device B** (phone on mobile data, wifi off → different IP) — one request:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://<svc>.onrender.com/api/v1/businesses
   ```
   Expected **`200`**. If B also gets `429`, buckets are shared across users →
   `trust proxy` is wrong. Fix the Render env var and redeploy.
3. Wait 15 min (or redeploy) to reset.

### Check 3c — boot log

Render → Logs, after a deploy:

```
trust proxy = 1 hop(s) — req.ip is taken 1 entry in from the right of X-Forwarded-For
```

Anything other than `1` (with no Cloudflare) → fix `TRUST_PROXY_HOPS` on Render.

---

## Operational notes

- **New collection `ratelimits`** appears in the database. It's high-churn,
  self-expiring, and safe to ignore in backups (the restore drill will show it
  with a different count — that's expected). You can drop it any time; it
  refills.
- **`resetAll()` / clearing limits:** `mongosh "$MONGO_URI" --eval
  'db.ratelimits.deleteMany({})'` clears every limiter immediately.
- The `ratelimits` documents are keyed `"<limiter>:<ip>"`, e.g. `ai:203.0.113.5`
  — handy for checking or clearing one client.
