
const API = import.meta.env.VITE_API_URL || "";

const authHeader = () => {
  const token = localStorage.getItem("touristToken");
  localStorage.getItem("trugoa_tourist_token")
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* Create a booking — called from BookingPage on form submit */
export const createBooking = async (payload) => {
  const res = await fetch(`${API}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Booking failed");
  return data;
};

/* Fetch all bookings for the logged-in tourist */
export const getMyBookings = async () => {
  const res = await fetch(`${API}/api/bookings/my`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load bookings");
  return data.bookings;
};

/* Fetch a single booking by ID */
export const getBookingById = async (id) => {
  const res = await fetch(`${API}/api/bookings/${id}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load booking");
  return data.booking;
};

/* Cancel a booking */
export const cancelBooking = async (id, reason = "") => {
  const res = await fetch(`${API}/api/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Cancel failed");
  return data;
};