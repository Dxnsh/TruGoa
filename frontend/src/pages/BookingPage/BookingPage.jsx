
import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Users, MapPin, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { TouristContext } from "../../context/TouristContext";
import { getBusinessById, createBooking } from "../../services/api";;
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
    customerName:   tourist?.name  || "",
    customerEmail:  tourist?.email || "",
    customerPhone:  "",
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
        const data = await getBusinessById(id);          // GET /api/businesses/:id
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
  setSubmitting(true); setSubmitError(null);
  try {
    const result = await createBooking({
      businessId:     id,
      bookingDate:    form.bookingDate,
      timeSlot:       form.timeSlot,
      guests:         parseInt(form.guests, 10),
      specialRequest: form.specialRequest,
      customerName:   form.customerName,    // ← add these 3
      customerEmail:  form.customerEmail,
      customerPhone:  form.customerPhone,
    });
    setBooking(result.booking);
    setSubmitted(true);
  } catch (e) {
    setSubmitError(e.message || "Something went wrong.");
  } finally {
    setSubmitting(false);
  }
};


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
          <button className="bp-btn-ghost-dark" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
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
            Booking confirmation will be sent to your registered email.
          </p>

          <form onSubmit={handleSubmit} className="bp-form">  
          <div className="bp-tourist-info">
            <div className="bp-tourist-avatar">
              {tourist?.avatar
                ? <img src={tourist.avatar} alt={tourist.name} referrerPolicy="no-referrer" />
                : <span>{tourist?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div className="bp-tourist-details">
              <p className="bp-tourist-name">{tourist?.name}</p>
              <p className="bp-tourist-email">{tourist?.email}</p>
            </div>
            <div className="bp-tourist-badge">✓ Verified</div>
          </div>

          {/* Phone — only field they need to fill */}
          <div className="bp-field">
            <label className="bp-label">Phone Number <span style={{color:"rgba(0,0,0,0.3)",fontWeight:400}}>(optional)</span></label>
            <input
              className="bp-input"
              placeholder="+91 98765 43210"
              value={form.customerPhone}
              onChange={e => set("customerPhone", e.target.value)}
            />
          </div>
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