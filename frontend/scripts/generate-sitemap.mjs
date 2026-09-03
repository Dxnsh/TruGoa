// Builds public/sitemap.xml before `vite build` picks up the public/ dir.
// Static routes are always included; business/story/journal/trending slugs are
// pulled live from the API so the sitemap never drifts from what's published.
//
// API base comes from SITEMAP_API_BASE_URL, falling back to VITE_API_BASE_URL
// — set one of these in CI/deploy env to the production API origin
// (e.g. https://api.trugoa.in/api/v1). Without it, dynamic URLs are skipped
// and only the static routes are written; that is the intended local default,
// not a failure.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://trugoa.in";
const API_BASE = process.env.SITEMAP_API_BASE_URL || process.env.VITE_API_BASE_URL;

const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/explore", changefreq: "daily", priority: "0.9" },
  { path: "/trending", changefreq: "daily", priority: "0.8" },
  { path: "/goaguide", changefreq: "weekly", priority: "0.7" },
  { path: "/journey", changefreq: "weekly", priority: "0.6" },
  { path: "/itinerary", changefreq: "weekly", priority: "0.6" },
  { path: "/journal", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/manifesto", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The API is on a platform that idles its instances, so the first request after
// a quiet period can time out or 502 purely because the container is starting.
// Three attempts with a widening gap turns a cold start into a slow build
// rather than a sitemap that silently loses every dynamic URL.
async function fetchJson(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const wait = 2000 * 2 ** i; // 2s, 4s
        console.warn(`[sitemap] ${err.message} — retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

// Every list endpoint that pages returns { items, total, … }; the rest return a
// bare array. Accept both so the script doesn't break the next time one of them
// gains pagination.
const listOf = (data) => (Array.isArray(data) ? data : data?.items ?? []);

async function getDynamicRoutes() {
  if (!API_BASE) {
    console.warn("[sitemap] No SITEMAP_API_BASE_URL/VITE_API_BASE_URL set — skipping dynamic URLs.");
    return { routes: [], attempted: false, failures: [] };
  }

  const routes = [];
  const failures = [];

  // Businesses are paged now, so walk the pages rather than taking whatever the
  // first one happens to hold.
  try {
    let page = 1;
    for (;;) {
      const { data } = await fetchJson(`${API_BASE}/businesses?page=${page}&limit=100`);
      const items = listOf(data);
      for (const b of items) {
        if (b.slug) routes.push({ path: `/listings/${b.slug}`, changefreq: "weekly", priority: "0.8" });
      }
      if (!data?.hasMore || items.length === 0) break;
      page += 1;
      if (page > 100) break; // hard stop, in case hasMore is ever wrong
    }
  } catch (err) {
    failures.push(`businesses: ${err.message}`);
  }

  try {
    const { data } = await fetchJson(`${API_BASE}/stories`);
    for (const c of listOf(data)) {
      if (!c.slug) continue;
      routes.push({ path: `/stories/${c.slug}`, changefreq: "weekly", priority: "0.7" });

      try {
        const { data: full } = await fetchJson(`${API_BASE}/stories/${c.slug}`);
        for (const s of full?.stories || []) {
          if (s.slug) routes.push({ path: `/stories/${c.slug}/${s.slug}`, changefreq: "monthly", priority: "0.6" });
        }
      } catch (err) {
        failures.push(`story detail ${c.slug}: ${err.message}`);
      }
    }
  } catch (err) {
    failures.push(`stories: ${err.message}`);
  }

  // The public journal endpoint returns published entries only, so drafts
  // never reach the sitemap.
  try {
    const { data } = await fetchJson(`${API_BASE}/journals`);
    for (const j of listOf(data)) {
      if (j.slug) routes.push({ path: `/journal/${j.slug}`, changefreq: "monthly", priority: "0.7" });
    }
  } catch (err) {
    failures.push(`journals: ${err.message}`);
  }

  // Trending places — public, active entries only.
  try {
    const { data } = await fetchJson(`${API_BASE}/trending`);
    for (const t of listOf(data)) {
      if (t.slug) routes.push({ path: `/trending/${t.slug}`, changefreq: "weekly", priority: "0.7" });
    }
  } catch (err) {
    failures.push(`trending: ${err.message}`);
  }

  return { routes, attempted: true, failures };
}

function buildXml(routes) {
  const urls = routes.map(({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const { routes: dynamicRoutes, attempted, failures } = await getDynamicRoutes();

for (const f of failures) console.warn(`[sitemap] Failed to fetch ${f}`);

// A configured API that returns nothing at all is a broken build, not a small
// sitemap: it silently ships a file with only the static routes and drops every
// listing, story and journal entry from search. Without an API base configured
// this is the documented local behaviour, so it stays a warning there.
if (attempted && dynamicRoutes.length === 0) {
  console.error(
    `[sitemap] API_BASE is set (${API_BASE}) but no dynamic URLs could be fetched — ` +
    `refusing to write a sitemap that silently drops every listing, story and journal entry.`
  );
  process.exit(1);
}

const xml = buildXml([...STATIC_ROUTES, ...dynamicRoutes]);
const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml);
console.log(
  `[sitemap] Wrote ${STATIC_ROUTES.length + dynamicRoutes.length} URLs ` +
  `(${STATIC_ROUTES.length} static, ${dynamicRoutes.length} dynamic) to ${outPath}`
);
