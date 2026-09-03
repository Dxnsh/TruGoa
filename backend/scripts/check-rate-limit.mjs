// scripts/check-rate-limit.mjs
//
// Three checks:
//   1. Clustering        — is the process actually running multiple workers?
//   2. Cross-worker limit — does a limit hold at its configured value no matter
//                           which worker answers? (proves the shared MongoDB
//                           store in middleware/rateLimitStore.js is working;
//                           with the old per-process MemoryStore the effective
//                           limit was ~configured x number-of-workers)
//   3. Trust proxy        — is the limit keyed on the real client IP, and can a
//                           forged X-Forwarded-For header mint a fresh bucket?
//
//   node scripts/check-rate-limit.mjs                          # http://localhost:5000
//   node scripts/check-rate-limit.mjs https://your.onrender.com
//
// Run LOCALLY against `npm start` (cluster.js), NOT `npm run dev` (single
// process) — check 2 can only prove something when more than one worker exists.
//
// The script uses the 10-second burst limiter (30 req / 10 s) so it is fast and
// self-cleaning; it pauses ~11 s between checks to let that window reset. It
// spends ~60 requests of the 100/15-min general budget — harmless, resets on
// its own. Full context: docs/RATE_LIMIT_VERIFICATION.md

const BASE = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");
const API = `${BASE}/api/v1/businesses`;
const HEALTH = `${BASE}/health`;
const BURST_MAX = 30; // middleware/rateLimiter.js burstLimiter.max
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(BASE);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = async (why) => {
  process.stdout.write(`\n(waiting 11s for the 10s burst window to reset — ${why}) `);
  await sleep(11_000);
  process.stdout.write("done\n");
};

const remainingHeader = (res) =>
  res.headers.get("ratelimit-remaining") ?? res.headers.get("x-ratelimit-remaining");
const limitHeader = (res) =>
  res.headers.get("ratelimit-limit") ?? res.headers.get("x-ratelimit-limit") ?? "?";

let failures = 0;
const fail = (line) => { failures++; console.log(`✗  ${line}`); };
const pass = (line) => console.log(`✓  ${line}`);
const info = (line) => console.log(`ℹ  ${line}`);

console.log(`Target: ${BASE}`);

// ─── Check 1 — clustering ────────────────────────────────────────────────────
console.log("\n── 1. Clustering ──");
const pids = new Set();
let healthOk = 0;
for (let i = 0; i < 12; i++) {
  try {
    const res = await fetch(HEALTH);
    if (res.ok) {
      healthOk++;
      const body = await res.json().catch(() => ({}));
      if (body.pid !== undefined) pids.add(body.pid);
    }
  } catch {
    /* counted as no pid */
  }
}

if (healthOk === 0) {
  fail("no successful /health responses — is the server running at this URL?");
} else if (pids.size === 0) {
  info(`/health answered but carries no "pid" field — deploy the updated server.js.`);
  info("Check 2 will still run but can't confirm the answers came from different workers.");
} else if (pids.size === 1) {
  info(`only ONE worker pid seen (${[...pids][0]}).`);
  info("Possible reasons:");
  info("  - you're running `npm run dev` (single process) instead of `npm start` (cluster)");
  info("  - the host has 1 CPU");
  info("  - Windows localhost: Node's cluster sends nearly all local connections to one");
  info("    worker (SCHED_NONE). On Linux/Render it round-robins, so run the definitive");
  info("    check against the deployed URL.");
  info("Check 2 still verifies the limit holds; with 1 visible worker it can't prove it's shared.");
} else {
  pass(`clustered — saw ${pids.size} distinct worker pids: ${[...pids].join(", ")}`);
}

await pause("before the flood test");

// ─── Check 2 — cross-worker limit enforcement ───────────────────────────────
console.log("\n── 2. Cross-worker limit enforcement ──");
console.log(`Firing 50 concurrent GET ${API} (burst limit is ${BURST_MAX} / 10s) ...`);

const responses = await Promise.allSettled(Array.from({ length: 50 }, () => fetch(API)));
let ok = 0;
let limited = 0;
let other = 0;
let seen429Limit = null;
for (const r of responses) {
  if (r.status !== "fulfilled") { other++; continue; }
  const s = r.value.status;
  if (s === 429) { limited++; seen429Limit ??= limitHeader(r.value); }
  else if (s >= 200 && s < 400) ok++;
  else other++;
}
console.log(`  ${ok} allowed, ${limited} rejected (429), ${other} other`);

if (limited === 0 && ok >= 45) {
  fail(`all ${ok} requests were allowed — the ${BURST_MAX}/10s burst limit did NOT hold.`);
  if (pids.size > 1) {
    console.log(`   With ${pids.size} workers this is the per-process-store signature:`);
    console.log("   each worker is counting to 30 on its own. The shared store is not in effect —");
    console.log("   check middleware/rateLimiter.js has `store: createMongoStore(...)` on every limiter,");
    console.log("   and that MongoDB is reachable (look for 'rate-limit store' warnings in the logs).");
  } else {
    console.log("   Burst limiting looks inactive on this path (or only 1 worker + a store problem).");
  }
} else if (limited > 0 && ok <= BURST_MAX + 12) {
  pass(`limit held at ~${BURST_MAX} (got ${ok}) regardless of which worker answered` +
    (seen429Limit ? ` — 429s report limit=${seen429Limit}` : ""));
  if (pids.size > 1) {
    console.log(`   Confirmed across ${pids.size} workers — the shared MongoDB store is working.`);
  } else {
    console.log("   (Only 1 worker was visible, so this shows the limit works, not that it's shared.)");
  }
} else {
  info(`ambiguous: ${ok} allowed, ${limited} rejected. Expected ~${BURST_MAX} allowed for a shared store,`);
  info(`or a multiple of ${BURST_MAX} for a per-process store. Re-run — a slow first request or a`);
  info("cold Render instance can skew a single pass.");
}

await pause("before the trust-proxy test");

// ─── Check 3 — trust proxy / spoofed X-Forwarded-For ────────────────────────
console.log("\n── 3. Trust proxy (real client IP, not a client header) ──");

const drain = async (label, headers) => {
  console.log(label);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    const res = await fetch(API, { headers });
    const rem = remainingHeader(res);
    seen.push(rem === null ? null : Number(rem));
    console.log(`  #${i + 1}  HTTP ${res.status}   remaining ${rem ?? "(none)"} / ${limitHeader(res)}`);
  }
  return seen.filter((n) => Number.isFinite(n));
};

const plain = await drain("A) plain requests:", {});
const spoofed = await drain('B) with forged "X-Forwarded-For: 203.0.113.7":', {
  "X-Forwarded-For": "203.0.113.7",
});

if (plain.length < 2) {
  info("no usable RateLimit-Remaining headers — can't judge trust proxy from here.");
} else {
  const lastA = plain[plain.length - 1];
  const firstB = spoofed[0];
  const spoofGotFreshBucket = firstB === undefined || firstB >= lastA;

  if (spoofGotFreshBucket && isLocal) {
    info(`EXPECTED on localhost: with no proxy in front, the forged header became req.ip`);
    info(`(run A ended at ${lastA}, run B restarted at ${firstB}). Re-run against Render for the real test.`);
  } else if (spoofGotFreshBucket && !isLocal) {
    fail(`the forged X-Forwarded-For header got a fresh bucket on the deployed server`);
    console.log(`   (run A ended at ${lastA}, run B restarted at ${firstB}).`);
    console.log("   => trust proxy is too permissive. Unset TRUST_PROXY_HOPS (or set 1) on Render.");
  } else {
    pass(`forged X-Forwarded-For ignored — same bucket kept draining (A ${lastA} -> B ${firstB}).`);
    if (!isLocal) {
      console.log("   Still do the two-device check in docs/RATE_LIMIT_VERIFICATION.md.");
    }
  }
}

// ─── verdict ────────────────────────────────────────────────────────────────
console.log("\n─── verdict ───");
if (failures === 0) {
  console.log("✓  No failures. See notes above for anything that couldn't be proven from one machine.");
  process.exit(0);
} else {
  console.log(`✗  ${failures} check(s) failed — see above.`);
  process.exit(1);
}
