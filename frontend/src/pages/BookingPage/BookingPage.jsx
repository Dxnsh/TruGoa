// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Clock3,
//   Users,
//   MapPin,
//   Phone,
//   Mail,
//   CheckCircle2,
// } from "lucide-react";

// import {
//   theme,
//   PrimaryButton,
//   Card,
//   Input,
//   SectionHeading,
// } from "../../Theme";

// const BookingPage = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
//   const [submitted, setSubmitted] = useState(false);

//   useEffect(() => {
//     const resize = () => setIsMobile(window.innerWidth < 900);
//     window.addEventListener("resize", resize);
//     return () => window.removeEventListener("resize", resize);
//   }, []);

//   // temp business data (later fetch by ID)
//   const business = {
//     id,
//     name: "Britto's Restaurant",
//     location: "Baga Beach, Goa",
//     image:
//       "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop",
//     rating: 4.6,
//     reviews: 1240,
//     price: "₹400–₹800 per person",
//   };

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     date: "",
//     time: "",
//     guests: "2",
//     notes: "",
//   });

//   const updateField = (key, value) =>
//     setForm((prev) => ({ ...prev, [key]: value }));

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     console.log({
//       businessId: id,
//       ...form,
//     });

//     setSubmitted(true);
//   };

//   /* ---------- SUCCESS SCREEN ---------- */
//   if (submitted) {
//     return (
//       <div
//         style={{
//           minHeight: "100vh",
//           background: theme.colors.bgPage,
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           padding: theme.spacing.lg,
//         }}
//       >
//         <Card
//           style={{
//             maxWidth: 560,
//             width: "100%",
//             textAlign: "center",
//             padding: isMobile ? 28 : 42,
//           }}
//         >
//           <CheckCircle2 size={56} color={theme.colors.secondary} />

//           <h1
//             style={{
//               fontFamily: theme.typography.fontDisplay,
//               fontSize: isMobile ? 36 : 52,
//               margin: "18px 0 10px",
//               color: theme.colors.textPrimary,
//             }}
//           >
//             Booking Request Sent
//           </h1>

//           <p
//             style={{
//               color: theme.colors.textBody,
//               lineHeight: 1.8,
//               marginBottom: 28,
//             }}
//           >
//             Your reservation request has been sent to{" "}
//             <strong>{business.name}</strong>. They’ll confirm shortly.
//           </p>

//           <PrimaryButton onClick={() => navigate("/")}>
//             Back to Home
//           </PrimaryButton>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         background: theme.colors.bgPage,
//         minHeight: "100vh",
//       }}
//     >
//       {/* HERO */}
//       <div
//         style={{
//           height: isMobile ? 280 : 380,
//           position: "relative",
//           backgroundImage: `
//             linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.55)),
//             url(${business.image})
//           `,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//         }}
//       >
//         <button
//           onClick={() => navigate(-1)}
//           style={{
//             position: "absolute",
//             top: 24,
//             left: 24,
//             width: 44,
//             height: 44,
//             borderRadius: theme.radii.full,
//             border: "none",
//             background: "rgba(255,255,255,.12)",
//             color: "white",
//             cursor: "pointer",
//           }}
//         >
//           <ArrowLeft size={18} />
//         </button>

//         <div
//           style={{
//             position: "absolute",
//             left: isMobile ? 20 : 56,
//             bottom: 32,
//             right: 20,
//             color: "white",
//           }}
//         >
//           <p
//             style={{
//               fontSize: theme.typography.sizeXs,
//               letterSpacing: "2px",
//               textTransform: "uppercase",
//               marginBottom: 10,
//             }}
//           >
//             Reserve Your Experience
//           </p>

//           <h1
//             style={{
//               fontFamily: theme.typography.fontDisplay,
//               fontSize: isMobile ? 44 : 76,
//               lineHeight: 1,
//               margin: 0,
//             }}
//           >
//             {business.name}
//           </h1>

//           <div
//             style={{
//               display: "flex",
//               gap: 14,
//               flexWrap: "wrap",
//               marginTop: 12,
//               fontSize: theme.typography.sizeSm,
//             }}
//           >
//             <span>⭐ {business.rating}</span>
//             <span>{business.reviews} reviews</span>
//             <span>{business.price}</span>
//           </div>
//         </div>
//       </div>

//       {/* CONTENT */}
//       <div
//         style={{
//           maxWidth: 1320,
//           margin: "0 auto",
//           padding: isMobile
//             ? "24px 16px 60px"
//             : "48px 24px 80px",
//           display: "grid",
//           gridTemplateColumns: isMobile ? "1fr" : "1.35fr .85fr",
//           gap: 24,
//         }}
//       >
//         {/* FORM */}
//         <Card style={{ padding: isMobile ? 22 : 34 }}>
//           <SectionHeading
//             title="Complete Your Reservation"
//             subtitle="Secure your place in just a minute."
//           />

//           <form onSubmit={handleSubmit}>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
//                 gap: 16,
//               }}
//             >
//               <Input
//                 placeholder="Full Name"
//                 value={form.name}
//                 onChange={(e) => updateField("name", e.target.value)}
//               />

//               <Input
//                 icon={<Phone size={16} />}
//                 placeholder="Phone Number"
//                 value={form.phone}
//                 onChange={(e) => updateField("phone", e.target.value)}
//               />

//               <Input
//                 icon={<Mail size={16} />}
//                 placeholder="Email Address"
//                 value={form.email}
//                 onChange={(e) => updateField("email", e.target.value)}
//               />

//               <Input
//                 icon={<CalendarDays size={16} />}
//                 type="date"
//                 value={form.date}
//                 onChange={(e) => updateField("date", e.target.value)}
//               />

//               <select
//                 value={form.time}
//                 onChange={(e) => updateField("time", e.target.value)}
//                 style={selectStyle}
//               >
//                 <option value="">Select Time</option>
//                 <option>7:00 PM</option>
//                 <option>7:30 PM</option>
//                 <option>8:00 PM</option>
//                 <option>8:30 PM</option>
//                 <option>9:00 PM</option>
//               </select>

//               <select
//                 value={form.guests}
//                 onChange={(e) => updateField("guests", e.target.value)}
//                 style={selectStyle}
//               >
//                 <option>1</option>
//                 <option>2</option>
//                 <option>3</option>
//                 <option>4</option>
//                 <option>5</option>
//                 <option>6+</option>
//               </select>
//             </div>

//             <textarea
//               placeholder="Special requests (window seat, birthday, allergies...)"
//               value={form.notes}
//               onChange={(e) => updateField("notes", e.target.value)}
//               style={{
//                 width: "100%",
//                 marginTop: 16,
//                 minHeight: 120,
//                 border: `1px solid ${theme.colors.borderLight}`,
//                 borderRadius: theme.radii.md,
//                 padding: 14,
//                 fontSize: theme.typography.sizeMd,
//                 fontFamily: theme.typography.fontBody,
//                 resize: "vertical",
//                 outline: "none",
//               }}
//             />

//             <PrimaryButton
//               style={{
//                 width: "100%",
//                 marginTop: 18,
//                 padding: "16px 24px",
//               }}
//             >
//               Confirm Booking
//             </PrimaryButton>
//           </form>
//         </Card>

//         {/* SUMMARY */}
//         <Card style={{ padding: isMobile ? 22 : 30, height: "fit-content" }}>
//           <SectionHeading
//             title="Booking Summary"
//             subtitle="Review before submitting."
//           />

//           <SummaryRow
//             icon={<MapPin size={18} />}
//             text={business.location}
//           />

//           <SummaryRow
//             icon={<CalendarDays size={18} />}
//             text={form.date || "Choose date"}
//           />

//           <SummaryRow
//             icon={<Clock3 size={18} />}
//             text={form.time || "Choose time"}
//           />

//           <SummaryRow
//             icon={<Users size={18} />}
//             text={`${form.guests} Guests`}
//           />

//           <div
//             style={{
//               marginTop: 22,
//               paddingTop: 18,
//               borderTop: `1px solid ${theme.colors.borderLight}`,
//             }}
//           >
//             <p
//               style={{
//                 fontSize: theme.typography.sizeSm,
//                 color: theme.colors.textMuted,
//               }}
//             >
//               Estimated Spend
//             </p>

//             <h3
//               style={{
//                 marginTop: 6,
//                 color: theme.colors.secondary,
//                 fontSize: 30,
//               }}
//             >
//               ₹2,000 – ₹3,500
//             </h3>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// };

// /* ---------- Helpers ---------- */

// const SummaryRow = ({ icon, text }) => (
//   <div
//     style={{
//       display: "flex",
//       alignItems: "center",
//       gap: 10,
//       marginBottom: 14,
//       color: theme.colors.textBody,
//       fontSize: theme.typography.sizeMd,
//     }}
//   >
//     {icon}
//     <span>{text}</span>
//   </div>
// );

// const selectStyle = {
//   width: "100%",
//   height: 44,
//   border: `1px solid ${theme.colors.borderLight}`,
//   borderRadius: theme.radii.md,
//   padding: "0 12px",
//   fontSize: theme.typography.sizeMd,
//   fontFamily: theme.typography.fontBody,
//   outline: "none",
//   background: "white",
// };

// export default BookingPage;

import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Users, MapPin, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { TouristContext } from "../../context/TouristContext";
import { getBusinesses } from "../../services/api";
import { createBooking } from "../../services/bookingApi";
import useIsMobile from "../../hooks/useIsMobile";
import "./BookingPage.css";

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM", "1:00 PM",  "1:30 PM",
  "7:00 PM",  "7:30 PM",  "8:00 PM",  "8:30 PM",  "9:00 PM",
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function BookingPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isMobile    = useIsMobile();
  const { tourist } = useContext(TouristContext);   // logged-in tourist (or null)

  const [business,   setBusiness  ] = useState(null);
  const [bizLoading, setBizLoading] = useState(true);
  const [bizError,   setBizError  ] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted ] = useState(false);
  const [submitError,setSubmitError] = useState(null);
  const [booking,    setBooking   ] = useState(null);

  const [form, setForm] = useState({
    bookingDate:    "",
    timeSlot:       "",
    guests:         "2",
    specialRequest: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  /* ── fetch business ──────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const data = await getBusiness(id);          // GET /api/businesses/:id
        setBusiness(data);
      } catch (e) {
        setBizError("Could not load business details.");
      } finally {
        setBizLoading(false);
      }
    })();
  }, [id]);

  /* ── estimated cost helper ───────────────────────────── */
  const estimatedCost = () => {
    if (!business?.price_range || !form.guests) return null;
    // price_range e.g. "₹400–₹800"
    const nums = business.price_range.match(/\d+/g);
    if (!nums || nums.length < 2) return null;
    const [lo, hi] = nums.map(Number);
    const g = parseInt(form.guests, 10) || 2;
    return `₹${(lo * g).toLocaleString("en-IN")} – ₹${(hi * g).toLocaleString("en-IN")}`;
  };

  /* ── submit ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tourist) return;       // guard — shouldn't reach here but safe
    if (!form.bookingDate || !form.timeSlot) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createBooking({
        businessId:     id,
        bookingDate:    form.bookingDate,
        timeSlot:       form.timeSlot,
        guests:         parseInt(form.guests, 10),
        specialRequest: form.specialRequest,
      });
      setBooking(result.booking);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── auth gate ───────────────────────────────────────── */
  if (!tourist) return (
    <div className="bp-root bp-gate">
      <div className="bp-gate-card">
        <Lock size={40} className="bp-gate-icon" />
        <h2 className="bp-gate-title">Sign in to book</h2>
        <p className="bp-gate-sub">
          You need a TruGoa tourist account to make a reservation.
          It takes less than a minute.
        </p>
        <button className="bp-btn-gold bp-gate-btn" onClick={() => navigate("/")}>
          Sign in with Google
        </button>
        <button className="bp-btn-ghost" onClick={() => navigate(-1)}>
          ← Go back
        </button>
      </div>
    </div>
  );

  /* ── business loading / error ────────────────────────── */
  if (bizLoading) return (
    <div className="bp-root bp-loading">
      <div className="bp-loading-ring" />
      <p className="bp-loading-text">Loading…</p>
    </div>
  );

  if (bizError) return (
    <div className="bp-root bp-gate">
      <div className="bp-gate-card">
        <AlertCircle size={40} style={{ color: "#C0392B" }} />
        <h2 className="bp-gate-title" style={{ color: "#C0392B" }}>Oops</h2>
        <p className="bp-gate-sub">{bizError}</p>
        <button className="bp-btn-ghost" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    </div>
  );

  /* ── success screen ──────────────────────────────────── */
  if (submitted) return (
    <div className="bp-root bp-success-page">
      <div className="bp-success-glow" />
      <div className="bp-success-card">
        <div className="bp-success-check">
          <CheckCircle2 size={52} />
        </div>
        <p className="bp-success-eyebrow">Booking Request Sent</p>
        <h1 className="bp-success-title"
          style={{ fontSize: isMobile ? "clamp(38px,10vw,56px)" : "clamp(52px,6vw,80px)" }}>
          You're almost there.
        </h1>
        <p className="bp-success-body">
          Your reservation request for <strong>{business?.name}</strong> has been sent.
          {tourist?.email && ` Confirmation will be sent to ${tourist.email}.`}
          <br />The business will confirm within a few hours.
        </p>

        {booking && (
          <div className="bp-success-ref">
            <span className="bp-success-ref-label">Reference</span>
            <span className="bp-success-ref-val">#{booking._id?.slice(-8).toUpperCase()}</span>
          </div>
        )}

        <div className="bp-success-actions">
          <button className="bp-btn-gold" onClick={() => navigate("/my-bookings")}>
            View My Bookings
          </button>
          <button className="bp-btn-ghost-dark" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  /* ── hero image URL ──────────────────────────────────── */
  const heroImg = business?.images?.[0]
    || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop";

  /* ══════════════════════════════════════════════════════
     MAIN BOOKING FORM
  ══════════════════════════════════════════════════════ */
  return (
    <div className="bp-root">

      {/* ── HERO ─────────────────────────────────────── */}
      <div className="bp-hero"
        style={{
          minHeight: isMobile ? 300 : 420,
          backgroundImage: `linear-gradient(to top, rgba(4,10,7,0.92) 0%, rgba(4,10,7,0.4) 50%, rgba(4,10,7,0.1) 100%), url(${heroImg})`,
        }}>
        <div className="grain" />

        <button className="bp-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>

        <div className="bp-hero-content"
          style={{
            left:   isMobile ? 24 : 64,
            bottom: isMobile ? 32 : 48,
            right:  isMobile ? 24 : "auto",
            maxWidth: isMobile ? "calc(100% - 48px)" : "56%",
          }}>
          <div className="bp-hero-eyebrow-row">
            <span className="bp-hero-eyebrow-line" />
            <span className="bp-hero-eyebrow-text">Reserve Your Experience</span>
          </div>
          <h1 className="bp-hero-title"
            style={{ fontSize: isMobile ? "clamp(36px,10vw,56px)" : "clamp(52px,6vw,88px)" }}>
            {business?.name}
          </h1>
          <div className="bp-hero-meta">
            {business?.rating   && <span>⭐ {business.rating}</span>}
            {business?.location && <span><MapPin size={12} /> {business.location}</span>}
            {business?.price_range && <span>{business.price_range} per person</span>}
          </div>
        </div>
      </div>


      {/* ── CONTENT GRID ─────────────────────────────── */}
      <div className="bp-content"
        style={{
          padding: isMobile ? "32px 20px 80px" : "56px clamp(32px,6vw,96px) 96px",
          gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
        }}>

        {/* ── LEFT: FORM ─────────────────────────────── */}
        <div className="bp-form-card">
          <p className="bp-section-eyebrow">Your Details</p>
          <h2 className="bp-section-title">Complete your reservation</h2>
          <p className="bp-section-sub">
            Logged in as <strong>{tourist?.name}</strong> · {tourist?.email}
          </p>

          <form onSubmit={handleSubmit} className="bp-form">

            {/* Date + Time */}
            <div className="bp-field-group"
              style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>

              <div className="bp-field">
                <label className="bp-label">
                  <CalendarDays size={13} /> Date
                </label>
                <input
                  className="bp-input"
                  type="date"
                  value={form.bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => set("bookingDate", e.target.value)}
                  required
                />
              </div>

              <div className="bp-field">
                <label className="bp-label">
                  <Clock3 size={13} /> Time Slot
                </label>
                <select
                  className="bp-input bp-select"
                  value={form.timeSlot}
                  onChange={e => set("timeSlot", e.target.value)}
                  required>
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guests */}
            <div className="bp-field">
              <label className="bp-label"><Users size={13} /> Number of Guests</label>
              <div className="bp-guest-row">
                {["1","2","3","4","5","6","7","8"].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`bp-guest-btn ${form.guests === n ? "active" : ""}`}
                    onClick={() => set("guests", n)}>
                    {n}
                  </button>
                ))}
                <span className="bp-guest-plus">8+</span>
              </div>
            </div>

            {/* Special requests */}
            <div className="bp-field">
              <label className="bp-label">Special Requests</label>
              <textarea
                className="bp-textarea"
                placeholder="Window seat, birthday celebration, dietary requirements, accessibility needs…"
                value={form.specialRequest}
                onChange={e => set("specialRequest", e.target.value)}
                rows={4}
              />
              <span className="bp-char-count">{form.specialRequest.length}/500</span>
            </div>

            {submitError && (
              <div className="bp-error">
                <AlertCircle size={14} /> {submitError}
              </div>
            )}

            <button
              type="submit"
              className="bp-btn-submit"
              disabled={submitting || !form.bookingDate || !form.timeSlot}>
              {submitting ? (
                <span className="bp-btn-spinner">Sending request…</span>
              ) : (
                "Confirm Reservation →"
              )}
            </button>

            <p className="bp-form-note">
              Free cancellation up to 2 hours before · No payment required now
            </p>
          </form>
        </div>


        {/* ── RIGHT: SUMMARY ─────────────────────────── */}
        <div className="bp-summary-col">

          {/* Summary card */}
          <div className="bp-summary-card">
            <p className="bp-section-eyebrow">Booking Summary</p>

            <div className="bp-summary-rows">
              <SummaryRow icon={<MapPin size={15}/>}
                label="Location" value={business?.location || "—"} />
              <SummaryRow icon={<CalendarDays size={15}/>}
                label="Date"
                value={form.bookingDate
                  ? new Date(form.bookingDate).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", year:"numeric" })
                  : "Not selected"} />
              <SummaryRow icon={<Clock3 size={15}/>}
                label="Time" value={form.timeSlot || "Not selected"} />
              <SummaryRow icon={<Users size={15}/>}
                label="Guests" value={`${form.guests} ${parseInt(form.guests) === 1 ? "guest" : "guests"}`} />
            </div>

            {estimatedCost() && (
              <div className="bp-summary-cost">
                <p className="bp-summary-cost-label">Estimated Total</p>
                <p className="bp-summary-cost-val">{estimatedCost()}</p>
                <p className="bp-summary-cost-note">
                  Based on {business?.price_range} × {form.guests} guests
                </p>
              </div>
            )}
          </div>

          {/* Trust signals */}
          <div className="bp-trust-card">
            {[
              { icon: "✦", text: "Verified business — physically checked by TruGoa team" },
              { icon: "₹", text: "Price shown is what locals pay. No tourist markup." },
              { icon: "⚡", text: "Instant confirmation email once owner accepts" },
            ].map((t, i) => (
              <div key={i} className="bp-trust-row">
                <span className="bp-trust-icon">{t.icon}</span>
                <span className="bp-trust-text">{t.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}

/* ── helper ──────────────────────────────────────────────── */
function SummaryRow({ icon, label, value }) {
  return (
    <div className="bp-summary-row">
      <span className="bp-summary-row-icon">{icon}</span>
      <div>
        <span className="bp-summary-row-label">{label}</span>
        <span className="bp-summary-row-val">{value}</span>
      </div>
    </div>
  );
}