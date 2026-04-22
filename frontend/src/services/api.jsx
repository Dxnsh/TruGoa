const API_URL = "http://localhost:5000/api/businesses";
const AUTH_URL = "http://localhost:5000/api/auth";
const ADMIN_URL = "http://localhost:5000/api/admin";
const TOURIST_URL = "http://localhost:5000/api/tourist";

// GET all businesses
export const getBusinesses = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch businesses");
  return res.json();
};

// GET single business by ID
export const getBusinessById = async (id) => {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error("Business not found");
  return res.json();
};

// CREATE business (includes image URLs)
export const createBusiness = async (data) => {
  const token = localStorage.getItem("trugoa_token");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" ,
      "Authorization": `Bearer ${token}`,

    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create business");
  return res.json();
};

// UPLOAD images to Cloudinary via backend
export const uploadBusinessImages = async (files) => {
  const token = localStorage.getItem("trugoa_token")
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData, // no Content-Type header — browser sets it automatically
  });
  if (!res.ok) throw new Error("Failed to upload images");
  return res.json(); // returns { urls: [...] }
};

// GET reviews for a business
export const getReviewsForBusiness = async (businessId) => {
  const res = await fetch(`http://localhost:5000/api/reviews?business_id=${businessId}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
};

// POST to our backend which proxies to Anthropic
export const sendChatMessage = async (messages) => {
  const res = await fetch("http://localhost:5000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("Failed to get response from GoaGuide AI");
  return res.json(); // returns { reply: "..." }
};

//REGISTER
export const registerOwner = async (data) => {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json(); // { token, owner }
};

// LOGIN
export const loginOwner = async (data) => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json(); // { token, owner }
};

//Admin Login
export const adminLogin = async (email, password) => {
  const res = await fetch(`${ADMIN_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json(); // { token }
};

export const adminGetBusinesses = async () => {
  const token = localStorage.getItem("trugoa_admin_token");
  const res = await fetch(`${ADMIN_URL}/businesses`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch businesses");
  return res.json();
};

// GET stats
export const adminGetStats = async () => {
  const token = localStorage.getItem("trugoa_admin_token");
  const res = await fetch(`${ADMIN_URL}/stats`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

// APPROVE business
export const adminApproveBusiness = async (id) => {
  const token = localStorage.getItem("trugoa_admin_token");
  const res = await fetch(`${ADMIN_URL}/businesses/${id}/approve`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to approve");
  return res.json();
};

// REJECT business
export const adminRejectBusiness = async (id) => {
  const token = localStorage.getItem("trugoa_admin_token");
  const res = await fetch(`${ADMIN_URL}/businesses/${id}/reject`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reject");
  return res.json();
};

// Google login
export const touristGoogleAuth = async (googleId, name, email, avatar) => {
  const res = await fetch(`${TOURIST_URL}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ googleId, name, email, avatar }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
};

// ── Booking API ──────────────────────────────────────────────

const authHeader = () => {
  const token = localStorage.getItem("touristToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createBooking = async (payload) => {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Booking failed");
  return data;
};

export const getMyBookings = async () => {
  const res = await fetch("/api/bookings/my", { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings;
};

export const getBookingById = async (id) => {
  const res = await fetch(`/api/bookings/${id}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load booking");
  return data.booking;
};

export const cancelBooking = async (id, reason = "") => {
  const res = await fetch(`/api/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Cancel failed");
  return data;
};

// Fetch a single business by ID (no auth needed — public route)
export const getBusiness = async (id) => {
  const res = await fetch(`/api/businesses/${id}`);
  
  // Log raw response for debugging
  const text = await res.text();
  console.log("getBusiness raw response:", res.status, text);
  
  if (!res.ok) throw new Error(`Business fetch failed: ${res.status} — ${text.slice(0, 100)}`);
  
  const data = JSON.parse(text);
  
  // Handle every shape your backend might return:
  // { _id, name, ... }  OR  { business: {...} }  OR  { data: {...} }  OR  { success, business: {...} }
  return data?.business ?? data?.data ?? data;
};