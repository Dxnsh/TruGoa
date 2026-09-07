// middleware/cacheControl.js
//
// Public read endpoints (the catalogue, stories, journals, trending) serve the
// same bytes to every visitor and change at most a few times a day — but with
// no Cache-Control header the browser revalidates every one on every page view
// and every back/forward navigation, so the homepage alone fires ~7 fresh
// round-trips through the rate limiter and the DB each time it is opened.
//
// This sets a short shared-cache lifetime plus a longer stale-while-revalidate
// window: the CDN/browser serves the cached copy instantly for `maxAge`
// seconds, then keeps serving the stale copy (while refreshing in the
// background) for up to `swr` seconds more. A curated listing site can
// comfortably be a minute stale; nothing here is per-user or sensitive.
//
// Only applied to GET, and never when a request carries an Authorization
// header — an authenticated read (an admin previewing drafts) must not land in
// a shared cache.
export const publicCache = (maxAge = 60, swr = 300) => (req, res, next) => {
  if (req.method === "GET" && !req.headers.authorization) {
    res.set("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${swr}`);
  } else {
    res.set("Cache-Control", "no-store");
  }
  next();
};
