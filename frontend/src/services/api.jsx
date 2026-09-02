// No localhost fallback. It used to be `|| "http://localhost:5000/api/v1"`,
// which meant a build made without VITE_API_BASE_URL shipped a bundle telling
// every visitor's browser to call their own machine — the whole site renders
// empty and error states while the backend is perfectly healthy, and nothing
// anywhere says why. vite.config.js now fails the production build outright
// when the variable is missing; this throw covers a dev server started the
// same way.
const BASE = import.meta.env.VITE_API_BASE_URL;
if (!BASE) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to frontend/.env for local work " +
      "(see .env.example), or to the Vercel project environment for deploys."
  );
}

const BUSINESS_URL  = `${BASE}/businesses`;
const AUTH_URL      = `${BASE}/auth`;
const ADMIN_URL     = `${BASE}/admin`;
const STORIES_URL   = `${BASE}/stories`;
const JOURNALS_URL  = `${BASE}/journals`;
const TOURIST_URL   = `${BASE}/tourist`;
const REVIEWS_URL   = `${BASE}/reviews`;
const ITINERARY_URL = `${BASE}/itinerary`;
const TRENDING_URL  = `${BASE}/trending`; 

const touristHeader = () => {
  const token = localStorage.getItem("trugoa_tourist_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Every successful response from the backend is shaped
// { success: true, message, data }. This unwraps to `data`.
const unwrap = (json) => json.data;

// ─── BUSINESSES (Public) ──────────────────────────────────────────────────────

// GET one page of approved businesses.
// Optional: { category, tag, area, priceLevel, featured, search, page, limit }
// `category` may be a comma-separated list; it is matched OR-ed with `tag`.
//
// Resolves to { items, total, page, limit, totalPages, hasMore } — this used
// to be a bare array of whole documents for the entire catalogue.
export const getBusinesses = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category)   query.set("category",   params.category);
  if (params.tag)        query.set("tag",        params.tag);
  if (params.area)       query.set("area",       params.area);
  if (params.priceLevel) query.set("priceLevel", params.priceLevel);
  if (params.featured)   query.set("featured",   "true");
  if (params.search)     query.set("search",     params.search);
  if (params.page)       query.set("page",       String(params.page));
  if (params.limit)      query.set("limit",      String(params.limit));

  const url = query.toString()
    ? `${BUSINESS_URL}?${query.toString()}`
    : BUSINESS_URL;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch businesses");
  const data = unwrap(await res.json());
  return { ...data, items: data?.items ?? [] };
};

// GET curated places near a coordinate, nearest first.
// Resolves to { scope, places }. `scope` says how wide the backend had to
// look before it found anything — "nearby" (within maxDistance), "region"
// (the caller's side of Goa) or "goa" (the whole catalogue) — so the UI can
// caption the deck honestly rather than calling everything "near you".
// Results carry a `distance` in metres only under scope "nearby"; the wider
// tiers aren't ranked by proximity.
export const getNearbyBusinesses = async ({ lat, lng, maxDistance = 15000, limit = 20, category } = {}) => {
  const query = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    maxDistance: String(maxDistance),
    limit: String(limit),
  });
  if (category) query.set("category", category);

  const res = await fetch(`${BUSINESS_URL}/nearby?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch nearby places");
  const data = unwrap(await res.json());
  return { scope: data?.scope ?? "goa", places: data?.places ?? [] };
};

// GET single business by MongoDB ID
export const getBusinessById = async (id) => {
  const res = await fetch(`${BUSINESS_URL}/${id}`);
  if (!res.ok) throw new Error("Business not found");
  return unwrap(await res.json());
};

// GET single business by slug (clean URL)
export const getBusinessBySlug = async (slug) => {
  const res = await fetch(`${BUSINESS_URL}/slug/${slug}`);
  if (!res.ok) throw new Error("Business not found");
  return unwrap(await res.json());
};

// ─── STORIES (Public) ─────────────────────────────────────────────────────────

// GET all story collections (summary fields only)
export const getStories = async () => {
  const res = await fetch(STORIES_URL);
  if (!res.ok) throw new Error("Failed to fetch stories");
  return unwrap(await res.json());
};

// GET a single story collection (full detail) by slug
export const getStoryBySlug = async (slug) => {
  const res = await fetch(`${STORIES_URL}/${slug}`);
  if (!res.ok) throw new Error("Story not found");
  return unwrap(await res.json());
};

// ─── JOURNAL (Public) ─────────────────────────────────────────────────────────
// Both routes return published entries only — drafts are admin-side.

// GET all journal entries (summary fields only)
export const getJournals = async () => {
  const res = await fetch(JOURNALS_URL);
  if (!res.ok) throw new Error("Failed to fetch journal entries");
  return unwrap(await res.json());
};

// GET a single journal entry (full detail) by slug
export const getJournalBySlug = async (slug) => {
  const res = await fetch(`${JOURNALS_URL}/${slug}`);
  if (!res.ok) throw new Error("Journal entry not found");
  return unwrap(await res.json());
};

// ─── CONTACT ──────────────────────────────────────────────────────────────────

// Sends a contact enquiry. Resolves only once the backend confirms the message
// was stored; any failure rejects with the server's message so the form can
// show what actually went wrong instead of a generic line.
export const submitContactMessage = async (payload) => {
  const res = await fetch(`${BASE}/contact`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Validation failures come back as { errors: [{ field, message }] }; the
    // first one is more useful than the generic "Validation failed" summary.
    throw new Error(err.errors?.[0]?.message || err.message || "Failed to send your message");
  }
  return unwrap(await res.json());
};

// ─── AI GUIDE ─────────────────────────────────────────────────────────────────

export const sendChatMessage = async (messages) => {
  const res = await fetch(`${BASE}/ai/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to get response from GoaGuide AI");
  }
  return unwrap(await res.json()); // { reply, action, redirectUrl? }
};

// ─── ITINERARY ────────────────────────────────────────────────────────────────

export const generateItinerary = async (form) => {
  const res = await fetch(`${ITINERARY_URL}/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(form),
  });
  if (!res.ok) throw new Error("Failed to generate itinerary");
  return unwrap(await res.json());
};

// Returns { form, data, updatedAt } for the signed-in tourist's last saved
// itinerary, or null if they've never generated/saved one or aren't signed in.
export const getMyItinerary = async () => {
  if (!localStorage.getItem("trugoa_tourist_token")) return null;
  const res = await fetch(`${ITINERARY_URL}/mine`, { headers: touristHeader() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch saved itinerary");
  return unwrap(await res.json());
};

// Upserts — replaces the tourist's previously saved itinerary, if any.
export const saveMyItinerary = async (form, data) => {
  const res = await fetch(`${ITINERARY_URL}/save`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...touristHeader() },
    body:    JSON.stringify({ form, data }),
  });
  if (!res.ok) throw new Error("Failed to save itinerary");
  return unwrap(await res.json());
};

// ─── OWNER AUTH ───────────────────────────────────────────────────────────────

export const registerOwner = async (data) => {
  const res = await fetch(`${AUTH_URL}/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Registration failed");
  }
  return unwrap(await res.json()); // { token, owner }
};

export const loginOwner = async (data) => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Login failed");
  }
  return unwrap(await res.json()); // { token, owner }
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

const adminHeader = () => ({
  "Authorization": `Bearer ${localStorage.getItem("trugoa_admin_token") || ""}`,
  "Content-Type":  "application/json",
});

export const adminLogin = async (email, password) => {
  const res = await fetch(`${ADMIN_URL}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Admin login failed");
  }
  return unwrap(await res.json()); // { token }
};

// One page of businesses, all statuses. Search runs server-side because the
// results are paged — filtering in the browser would only ever search the
// page already loaded.
// Resolves to { items, total, page, limit, totalPages, hasMore }.
export const adminGetBusinesses = async ({ page, limit, search } = {}) => {
  const query = new URLSearchParams();
  if (page)   query.set("page",   String(page));
  if (limit)  query.set("limit",  String(limit));
  if (search) query.set("search", search);

  const url = query.toString()
    ? `${ADMIN_URL}/businesses?${query.toString()}`
    : `${ADMIN_URL}/businesses`;

  const res = await fetch(url, { headers: adminHeader() });
  if (!res.ok) throw new Error(String(res.status));
  const data = unwrap(await res.json());
  return { ...data, items: data?.items ?? [] };
};

export const adminDeleteBusiness = async (id) => {
  const res = await fetch(`${ADMIN_URL}/businesses/${id}`, {
    method:  "DELETE",
    headers: adminHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete business");
  }
  return unwrap(await res.json());
};

export const adminGetStats = async () => {
  const res = await fetch(`${ADMIN_URL}/stats`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return unwrap(await res.json());
};

export const adminApproveBusiness = async (id) => {
  const res = await fetch(`${ADMIN_URL}/businesses/${id}/approve`, {
    method:  "PATCH",
    headers: adminHeader(),
  });
  if (!res.ok) throw new Error("Failed to approve");
  return unwrap(await res.json());
};

// reason: string — saved to DB and displayed back to business owner
export const adminRejectBusiness = async (id, reason) => {
  const res = await fetch(`${ADMIN_URL}/businesses/${id}/reject`, {
    method:  "PATCH",
    headers: adminHeader(),
    body:    JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to reject");
  return unwrap(await res.json());
};

// files: File[] — uploads 1+ images, returns { urls: string[] }
export const adminUploadImages = async (files) => {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);

  const res = await fetch(`${ADMIN_URL}/upload`, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${localStorage.getItem("trugoa_admin_token") || ""}` },
    body:    formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload image");
  }
  // { urls: string[], images: [{ url, publicId }] } — `urls` is unchanged for
  // every existing caller; `images` carries the id needed to delete an asset.
  return unwrap(await res.json());
};

// Deletes one Cloudinary asset this app uploaded. Only the public_id travels;
// the API secret stays on the server. Best-effort by design — a picture that
// fails to delete is an orphaned file, not a broken form.
export const adminDeleteUploadedImage = async (publicId) => {
  if (!publicId) return;
  try {
    await fetch(`${ADMIN_URL}/upload`, {
      method:  "DELETE",
      headers: adminHeader(),
      body:    JSON.stringify({ publicId }),
    });
  } catch {
    // Swallowed on purpose: the admin is mid-edit and the upload they are
    // replacing is already gone from the form either way.
  }
};

export const adminCreateStory = async (data) => {
  const res = await fetch(`${ADMIN_URL}/stories`, {
    method:  "POST",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create story");
  }
  return unwrap(await res.json());
};

export const adminUpdateStory = async (id, data) => {
  const res = await fetch(`${ADMIN_URL}/stories/${id}`, {
    method:  "PUT",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update story");
  }
  return unwrap(await res.json());
};

export const adminDeleteStory = async (id) => {
  const res = await fetch(`${ADMIN_URL}/stories/${id}`, {
    method:  "DELETE",
    headers: adminHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete story");
  }
  return unwrap(await res.json());
};

// ─── ADMIN TEAM ───────────────────────────────────────────────────────────────
// Every admin can read /me; the roster routes are owner-only and 403 otherwise.

export const adminGetMe = async () => {
  const res = await fetch(`${ADMIN_URL}/me`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Failed to load your account");
  return unwrap(await res.json());
};

export const adminGetUsers = async () => {
  const res = await fetch(`${ADMIN_URL}/users`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Failed to fetch admins");
  return unwrap(await res.json());
};

export const adminCreateUser = async (data) => {
  const res = await fetch(`${ADMIN_URL}/users`, {
    method:  "POST",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to add admin");
  }
  return unwrap(await res.json());
};

export const adminUpdateUser = async (id, data) => {
  const res = await fetch(`${ADMIN_URL}/users/${id}`, {
    method:  "PATCH",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update admin");
  }
  return unwrap(await res.json());
};

export const adminResetUserPassword = async (id, password) => {
  const res = await fetch(`${ADMIN_URL}/users/${id}/password`, {
    method:  "PUT",
    headers: adminHeader(),
    body:    JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to set password");
  }
  return unwrap(await res.json());
};

export const adminDeleteUser = async (id) => {
  const res = await fetch(`${ADMIN_URL}/users/${id}`, {
    method:  "DELETE",
    headers: adminHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to remove admin");
  }
  return unwrap(await res.json());
};

// Unlike the public list, this one includes drafts.
export const adminGetJournals = async () => {
  const res = await fetch(`${ADMIN_URL}/journals`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Failed to fetch journal entries");
  return unwrap(await res.json());
};

// Full detail by id, drafts included — the edit form loads through this.
export const adminGetJournal = async (id) => {
  const res = await fetch(`${ADMIN_URL}/journals/${id}`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Journal entry not found");
  return unwrap(await res.json());
};

export const adminCreateJournal = async (data) => {
  const res = await fetch(`${ADMIN_URL}/journals`, {
    method:  "POST",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create journal entry");
  }
  return unwrap(await res.json());
};

export const adminUpdateJournal = async (id, data) => {
  const res = await fetch(`${ADMIN_URL}/journals/${id}`, {
    method:  "PUT",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update journal entry");
  }
  return unwrap(await res.json());
};

export const adminDeleteJournal = async (id) => {
  const res = await fetch(`${ADMIN_URL}/journals/${id}`, {
    method:  "DELETE",
    headers: adminHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete journal entry");
  }
  return unwrap(await res.json());
};

// ─── TOURIST AUTH ─────────────────────────────────────────────────────────────

// credential: the Google ID token from the GoogleLogin credential flow.
// The backend verifies it server-side — the client never asserts its own identity.
export const touristGoogleAuth = async (credential) => {
  const res = await fetch(`${TOURIST_URL}/google`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Google sign-in failed");
  }
  return unwrap(await res.json()); // { token, tourist }
};

// GET the signed-in tourist's saved places (populated Business docs)
export const getFavorites = async () => {
  const res = await fetch(`${TOURIST_URL}/favorites`, { headers: touristHeader() });
  if (!res.ok) throw new Error("Failed to fetch saved places");
  return unwrap(await res.json());
};

export const addFavorite = async (businessId) => {
  const res = await fetch(`${TOURIST_URL}/favorites/${businessId}`, {
    method:  "POST",
    headers: touristHeader(),
  });
  if (!res.ok) throw new Error("Failed to save place");
  return unwrap(await res.json());
};

export const removeFavorite = async (businessId) => {
  const res = await fetch(`${TOURIST_URL}/favorites/${businessId}`, {
    method:  "DELETE",
    headers: touristHeader(),
  });
  if (!res.ok) throw new Error("Failed to unsave place");
  return unwrap(await res.json());
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const getReviewsForBusiness = async (businessId) => {
  const res = await fetch(`${REVIEWS_URL}?business_id=${businessId}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return unwrap(await res.json()); // { total, reviews }
};

// Signed-in tourists don't need to pass name/city — the server takes
// identity from the auth token when one is present.
export const createReview = async (payload) => {
  const res = await fetch(REVIEWS_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...touristHeader() },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit review");
  }
  return unwrap(await res.json());
};

// Signed-in tourists only — the server records who voted so the same
// account can't vote twice. Throws "401" when nobody is signed in, which
// the caller turns into a sign-in prompt.
export const markReviewHelpful = async (reviewId) => {
  const res = await fetch(`${REVIEWS_URL}/${reviewId}/helpful`, {
    method:  "PATCH",
    headers: touristHeader(),
  });
  if (!res.ok) throw new Error(String(res.status));
  return unwrap(await res.json()); // { helpfulCount }
};


// public
export const getTrendingPlaces = async () => {
  const res = await fetch(TRENDING_URL);
  if (!res.ok) throw new Error("Failed to fetch trending places");
  return unwrap(await res.json());
};

export const getTrendingPlaceBySlug = async (slug) => {
  const res = await fetch(`${TRENDING_URL}/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch trending place");
  return unwrap(await res.json());
};

// Admin
export const adminCreateBusiness = async (data) => {
  const res = await fetch(`${ADMIN_URL}/businesses`, {
    method:  "POST",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create business");
  }
  return unwrap(await res.json());
};

export const adminUpdateBusiness = async (id, data) => {
  const res = await fetch(`${ADMIN_URL}/businesses/${id}`, {
    method:  "PUT",
    headers: adminHeader(),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update business");
  }
  return unwrap(await res.json());
};
export const adminGetTrendingPlaces = async () => {
  const res = await fetch(`${TRENDING_URL}/admin/all`, { headers: adminHeader() });
  if (!res.ok) throw new Error("Failed to fetch trending places");
  return unwrap(await res.json());
};

export const adminCreateTrendingPlace = async (data) => {
  const res = await fetch(TRENDING_URL, {
    method: "POST",
    headers: adminHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create trending place");
  }
  return unwrap(await res.json());
};

export const adminUpdateTrendingPlace = async (id, data) => {
  const res = await fetch(`${TRENDING_URL}/${id}`, {
    method: "PUT",
    headers: adminHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update trending place");
  }
  return unwrap(await res.json());
};

export const adminDeleteTrendingPlace = async (id) => {
  const res = await fetch(`${TRENDING_URL}/${id}`, {
    method: "DELETE",
    headers: adminHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete trending place");
  }
  return unwrap(await res.json());
};

export const adminReorderTrendingPlaces = async (order) => {
  const res = await fetch(`${TRENDING_URL}/reorder`, {
    method: "PATCH",
    headers: adminHeader(),
    body: JSON.stringify({ order }),
  });
  if (!res.ok) throw new Error("Failed to reorder");
  return unwrap(await res.json());
};