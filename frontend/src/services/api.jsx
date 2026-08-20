const BASE          = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const BUSINESS_URL  = `${BASE}/businesses`;
const AUTH_URL      = `${BASE}/auth`;
const ADMIN_URL     = `${BASE}/admin`;
const STORIES_URL   = `${BASE}/stories`;
const JOURNALS_URL  = `${BASE}/journals`;
const TOURIST_URL   = `${BASE}/tourist`;
const REVIEWS_URL   = `${BASE}/reviews`;
const ITINERARY_URL = `${BASE}/itinerary`;

const touristHeader = () => {
  const token = localStorage.getItem("trugoa_tourist_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Every successful response from the backend is shaped
// { success: true, message, data }. This unwraps to `data`.
const unwrap = (json) => json.data;

// ─── BUSINESSES (Public) ──────────────────────────────────────────────────────

// GET all approved businesses
// Optional: pass { category, area, priceLevel, featured, search }
export const getBusinesses = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category)   query.set("category",   params.category);
  if (params.area)       query.set("area",        params.area);
  if (params.priceLevel) query.set("priceLevel",  params.priceLevel);
  if (params.featured)   query.set("featured",    "true");
  if (params.search)     query.set("search",      params.search);

  const url = query.toString()
    ? `${BUSINESS_URL}?${query.toString()}`
    : BUSINESS_URL;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch businesses");
  return unwrap(await res.json());
};

// GET curated places near a coordinate, nearest first.
// Each result carries a `distance` field in metres (added by $geoNear).
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
  return unwrap(await res.json());
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

export const adminGetBusinesses = async () => {
  const res = await fetch(`${ADMIN_URL}/businesses`, { headers: adminHeader() });
  if (!res.ok) throw new Error(String(res.status));
  return unwrap(await res.json());
};

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
  return unwrap(await res.json());
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

export const markReviewHelpful = async (reviewId) => {
  const res = await fetch(`${REVIEWS_URL}/${reviewId}/helpful`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark review helpful");
  return unwrap(await res.json()); // { helpfulCount }
};
