// Builds public/sitemap.xml before `vite build` picks up the public/ dir.
// Static routes are always included; business/story/journal slugs are pulled
// live from the API so the sitemap never drifts from what's actually published.
//
// API base comes from SITEMAP_API_BASE_URL, falling back to VITE_API_BASE_URL
// — set one of these in CI/deploy env to the production API origin
// (e.g. https://api.trugoa.in/api/v1). Without it, dynamic URLs are skipped
// and only the static routes are written.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://trugoa.in";
const API_BASE = process.env.SITEMAP_API_BASE_URL || process.env.VITE_API_BASE_URL;

const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/explore", changefreq: "daily", priority: "0.9" },
  { path: "/goaguide", changefreq: "weekly", priority: "0.7" },
  { path: "/journey", changefreq: "weekly", priority: "0.6" },
  { path: "/itinerary", changefreq: "weekly", priority: "0.6" },
  { path: "/journal", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/manifesto", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getDynamicRoutes() {
  if (!API_BASE) {
    console.warn("[sitemap] No SITEMAP_API_BASE_URL/VITE_API_BASE_URL set — skipping dynamic business/story URLs.");
    return [];
  }

  const routes = [];

  try {
    const { data: businesses = [] } = await fetchJson(`${API_BASE}/businesses`);
    for (const b of businesses) {
      if (b.slug) routes.push({ path: `/listings/${b.slug}`, changefreq: "weekly", priority: "0.8" });
    }
  } catch (err) {
    console.warn("[sitemap] Failed to fetch businesses:", err.message);
  }

  try {
    const { data: collections = [] } = await fetchJson(`${API_BASE}/stories`);
    for (const c of collections) {
      if (!c.slug) continue;
      routes.push({ path: `/stories/${c.slug}`, changefreq: "weekly", priority: "0.7" });

      try {
        const { data: full } = await fetchJson(`${API_BASE}/stories/${c.slug}`);
        for (const s of full?.stories || []) {
          if (s.slug) routes.push({ path: `/stories/${c.slug}/${s.slug}`, changefreq: "monthly", priority: "0.6" });
        }
      } catch (err) {
        console.warn(`[sitemap] Failed to fetch story detail for ${c.slug}:`, err.message);
      }
    }
  } catch (err) {
    console.warn("[sitemap] Failed to fetch stories:", err.message);
  }

  // The public journal endpoint returns published entries only, so drafts
  // never reach the sitemap.
  try {
    const { data: journals = [] } = await fetchJson(`${API_BASE}/journals`);
    for (const j of journals) {
      if (j.slug) routes.push({ path: `/journal/${j.slug}`, changefreq: "monthly", priority: "0.7" });
    }
  } catch (err) {
    console.warn("[sitemap] Failed to fetch journal entries:", err.message);
  }

  return routes;
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

const dynamicRoutes = await getDynamicRoutes();
const xml = buildXml([...STATIC_ROUTES, ...dynamicRoutes]);
const outPath = resolve(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml);
console.log(`[sitemap] Wrote ${STATIC_ROUTES.length + dynamicRoutes.length} URLs to ${outPath}`);
