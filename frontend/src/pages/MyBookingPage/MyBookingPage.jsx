import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Users, MapPin, X, AlertCircle } from "lucide-react";
import { TouristContext } from "../../context/TouristContext";
import { getMyBookings, cancelBooking } from "../../services/api";
import useIsMobile from "../../hooks/useIsMobile";
import "./MyBookingPage.css"

/* ── status display config ───────────────────────────────── */
const STATUS = {
  pending:   { label: "Awaiting Confirmation", color: "#B86A00", bg: "#FEF3E0", dot: "#F0A429" },
  confirmed: { label: "Confirmed",             color: "#1A5C38", bg: "#E8F5EE", dot: "#4ade80" },
  cancelled: { label: "Cancelled",             color: "#7A7068", bg: "#F0ECE6", dot: "#AAA098" },
  rejected:  { label: "Declined",              color: "#A83232", bg: "#FDE8E8", dot: "#E05252" },
  completed: { label: "Completed",             color: "#2D6A4F", bg: "#EEF5F1", dot: "#2D6A4F" },
  no_show:   { label: "No Show",               color: "#7A7068", bg: "#F0ECE6", dot: "#AAA098" },
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function MyBookingsPage() {
  const navigate   = useNavigate();
  const isMobile   = useIsMobile();
  const { tourist }= useContext(TouristContext);

  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState("all");   // all | upcoming | past

  // Cancel confirmation modal state
  const [cancelTarget, setCancelTarget] = useState(null); // booking id
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState(null);

  /* ── redirect if not logged in ───────────────────────── */
  useEffect(() => {
    if (!tourist) navigate("/");
  }, [tourist, navigate]);

  /* ── fetch bookings ──────────────────────────────────── */
  useEffect(() => {
    if (!tourist) return;
    (async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (e) {
        setError(e.message || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tourist]);

  /* ── cancel handler ──────────────────────────────────── */
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true); setCancelError(null);
    try {
      await cancelBooking(cancelTarget, cancelReason);
      setBookings(prev => prev.map(b =>
        b._id === cancelTarget ? { ...b, status: "cancelled" } : b
      ));
      setCancelTarget(null); setCancelReason("");
    } catch (e) {
      setCancelError(e.message || "Could not cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  /* ── filter bookings ─────────────────────────────────── */
  const today = new Date();
  today.setHours(0,0,0,0);

  const displayed = bookings.filter(b => {
    if (filter === "all") return true;
    const d = new Date(b.bookingDate);
    if (filter === "upcoming") return d >= today && b.status !== "cancelled" && b.status !== "rejected";
    if (filter === "past")     return d < today  || b.status === "completed" || b.status === "cancelled";
    return true;
  });

  const canCancel = (b) => ["pending","confirmed"].includes(b.status);

  /* ── loading ─────────────────────────────────────────── */
  if (loading) return (
    <div className="mb-root mb-loading">
      <div className="mb-loading-ring" />
      <p className="mb-loading-text">Loading your bookings…</p>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="mb-root">

      {/* ── TOP BAR ──────────────────────────────────── */}
      <div className="mb-topbar"
        style={{ padding: isMobile ? "0 20px" : "0 clamp(32px,6vw,96px)" }}>
        <button className="mb-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="mb-topbar-logo" onClick={() => navigate("/")}>
          <span style={{ color: "#2D6A4F" }}>Tru</span>
          <span style={{ color: "#F0B429" }}>Goa</span>
        </div>
      </div>

      <div className="mb-inner"
        style={{ padding: isMobile ? "40px 20px 80px" : "56px clamp(32px,6vw,96px) 96px" }}>

        {/* ── HEADER ───────────────────────────────── */}
        <div className="mb-header">
          <div>
            <p className="mb-eyebrow">My Account</p>
            <h1 className="mb-title"
              style={{ fontSize: isMobile ? "clamp(40px,11vw,62px)" : "clamp(52px,6vw,88px)" }}>
              Your Bookings
            </h1>
            {tourist?.name && (
              <p className="mb-welcome">
                Welcome back, <em>{tourist.name.split(" ")[0]}</em>
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="mb-stats">
            {[
              { num: bookings.length, label: "Total" },
              { num: bookings.filter(b => b.status === "confirmed").length,  label: "Confirmed" },
              { num: bookings.filter(b => b.status === "pending").length,    label: "Pending" },
              { num: bookings.filter(b => b.status === "completed").length,  label: "Completed" },
            ].map(s => (
              <div key={s.label} className="mb-stat">
                <div className="mb-stat-rule" />
                <span className="mb-stat-num">{s.num}</span>
                <span className="mb-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-rule" />

        {/* ── FILTER TABS ──────────────────────────── */}
        <div className="mb-filters">
          {["all","upcoming","past"].map(f => (
            <button key={f}
              className={`mb-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* ── ERROR ─────────────────────────────────── */}
        {error && (
          <div className="mb-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── EMPTY ─────────────────────────────────── */}
        {!loading && displayed.length === 0 && (
          <div className="mb-empty">
            <div className="mb-empty-icon">🌴</div>
            <h3 className="mb-empty-title">
              {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
            </h3>
            <p className="mb-empty-sub">
              {filter === "all"
                ? "When you book a place through TruGoa, it'll appear here."
                : "Nothing matching this filter."}
            </p>
            {filter === "all" && (
              <button className="mb-btn-green" onClick={() => navigate("/listings")}>
                Explore Places →
              </button>
            )}
            {filter !== "all" && (
              <button className="mb-btn-outline" onClick={() => setFilter("all")}>
                Show all bookings
              </button>
            )}
          </div>
        )}

        {/* ── BOOKING CARDS ────────────────────────── */}
        <div className="mb-cards">
          {displayed.map((b, i) => {
            const s   = STATUS[b.status] || STATUS.pending;
            const img = b.business?.images?.[0] || null;
            const d   = new Date(b.bookingDate);
            const dateStr = d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", year:"numeric" });
            const isPast  = d < today || ["completed","cancelled","rejected"].includes(b.status);

            return (
              <div key={b._id}
                className={`mb-card ${isPast ? "mb-card-past" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}>

                {/* Left: image */}
                <div className="mb-card-img-wrap">
                  {img
                    ? <img src={img} alt={b.business?.name} className="mb-card-img" />
                    : <div className="mb-card-img-placeholder">🏖️</div>
                  }
                  {/* Status dot overlay */}
                  <div className="mb-card-status-dot" style={{ background: s.dot }} />
                </div>

                {/* Right: content */}
                <div className="mb-card-body">
                  <div className="mb-card-top">
                    <div>
                      <span className="mb-card-status-pill"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <h3 className="mb-card-name">{b.business?.name || "—"}</h3>
                      {b.business?.location && (
                        <div className="mb-card-location">
                          <MapPin size={11} /> {b.business.location}
                        </div>
                      )}
                    </div>
                    <div className="mb-card-ref">
                      #{b._id?.slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div className="mb-card-details">
                    <span><CalendarDays size={12} /> {dateStr}</span>
                    <span><Clock3 size={12} /> {b.timeSlot}</span>
                    <span><Users size={12} /> {b.guests} {b.guests === 1 ? "guest" : "guests"}</span>
                  </div>

                  {b.specialRequest && (
                    <p className="mb-card-request">"{b.specialRequest}"</p>
                  )}

                  {b.internalNote && (
                    <div className="mb-card-owner-note">
                      <span className="mb-card-owner-note-label">Business note</span>
                      <span>{b.internalNote}</span>
                    </div>
                  )}

                  <div className="mb-card-footer">
                    <span className="mb-card-booked-on">
                      Booked {new Date(b.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                    </span>
                    <div className="mb-card-actions">
                      <button className="mb-btn-view"
                        onClick={() => navigate(`/business/${b.business?._id}`)}>
                        View Place
                      </button>
                      {canCancel(b) && (
                        <button className="mb-btn-cancel"
                          onClick={() => { setCancelTarget(b._id); setCancelError(null); }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CANCEL MODAL ─────────────────────────────── */}
      {cancelTarget && (
        <div className="mb-modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="mb-modal" onClick={e => e.stopPropagation()}>
            <div className="mb-modal-header">
              <h3 className="mb-modal-title">Cancel Booking</h3>
              <button className="mb-modal-close" onClick={() => setCancelTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="mb-modal-sub">
              Are you sure? This cannot be undone. Free cancellation applies up to 2 hours before your reservation.
            </p>
            <div className="mb-field">
              <label className="mb-label">Reason (optional)</label>
              <textarea
                className="mb-textarea"
                placeholder="Plans changed, found another option…"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            {cancelError && (
              <div className="mb-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={14} /> {cancelError}
              </div>
            )}
            <div className="mb-modal-actions">
              <button className="mb-btn-cancel-confirm"
                onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Yes, Cancel Booking"}
              </button>
              <button className="mb-btn-outline" onClick={() => setCancelTarget(null)}>
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}