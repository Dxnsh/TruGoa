import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getOwnerDashboard,
  getOwnerBusinesses,
  getOwnerBookings,
  updateOwnerBookingStatus,
} from "../../services/api";
import useIsMobile from "../../hooks/useIsMobile";
import "./OwnerDashboard.css";

/* ── status config ───────────────────────────────────────── */
const BOOKING_STATUS = {
  pending:   { label: "Awaiting",   color: "#B86A00", bg: "#FEF3E0", dot: "#F0A429" },
  confirmed: { label: "Confirmed",  color: "#1A5C38", bg: "#E8F5EE", dot: "#4ade80" },
  rejected:  { label: "Declined",   color: "#A83232", bg: "#FDE8E8", dot: "#E05252" },
  cancelled: { label: "Cancelled",  color: "#7A7068", bg: "#F0ECE6", dot: "#AAA098" },
  completed: { label: "Completed",  color: "#2D6A4F", bg: "#EEF5F1", dot: "#2D6A4F" },
  no_show:   { label: "No Show",    color: "#7A7068", bg: "#F0ECE6", dot: "#AAA098" },
};

const LISTING_STATUS = {
  pending:  { label: "Under Review", color: "#B86A00", bg: "#FEF3E0" },
  approved: { label: "Live",         color: "#1A5C38", bg: "#E8F5EE" },
  rejected: { label: "Rejected",     color: "#A83232", bg: "#FDE8E8" },
};

const TABS = ["Overview", "Listings", "Bookings"];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function OwnerDashboard() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const { owner, logout, isLoggedIn, authLoading } = useAuth();

  const [tab,       setTab      ] = useState("Overview");
  const [stats,     setStats    ] = useState(null);
  const [businesses,setBusinesses] = useState([]);
  const [bookings,  setBookings ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [bkFilter,  setBkFilter ] = useState("all");

  // Action states
  const [actionId,  setActionId ] = useState(null);  // booking being actioned
  const [actionNote,setActionNote] = useState("");
  const [actioning, setActioning] = useState(false);
  const [actionErr, setActionErr ] = useState(null);

  /* ── guard ──────────────────────────────────────────────── */
useEffect(()=>{
    if (!authLoading && !isLoggedIn){
        navigate("/auth", {replace:true})
    }
},      [isLoggedIn, authLoading, navigate]);
  /* ── fetch all data ─────────────────────────────────────── */
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const [s, b, bk] = await Promise.all([
          getOwnerDashboard(),
          getOwnerBusinesses(),
          getOwnerBookings(),
        ]);
        setStats(s);
        setBusinesses(b);
        setBookings(bk);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn]);

  /* ── refetch bookings on filter change ──────────────────── */
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      const bk = await getOwnerBookings(bkFilter);
      setBookings(bk);
    })();
  }, [bkFilter, isLoggedIn]);

  /* ── booking action ─────────────────────────────────────── */
  const handleAction = async (id, status) => {
    setActioning(true); setActionErr(null);
    try {
      await updateOwnerBookingStatus(id, status, actionNote);
      setBookings(prev =>
        prev.map(b => b._id === id ? { ...b, status, internalNote: actionNote } : b)
      );
      // update stats
      setStats(prev => prev ? {
        ...prev,
        newBookings:  status === "confirmed" || status === "rejected"
          ? Math.max(0, prev.newBookings - 1) : prev.newBookings,
        confirmed: status === "confirmed" ? prev.confirmed + 1 : prev.confirmed,
      } : prev);
      setActionId(null); setActionNote("");
    } catch (e) {
      setActionErr(e.message);
    } finally {
      setActioning(false);
    }
  };

  const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";

  return "Good night";
};

  /* ── guards ─────────────────────────────────────────────── */
  if (authLoading || loading) return (
    <div className="od-loading">
      <div className="od-loading-ring" />
      <p className="od-loading-text">Loading dashboard…</p>
    </div>
  );

  if (!isLoggedIn) return null;

  const pendingBookings = bookings.filter(b => b.status === "pending");

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="od-root">

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div className="od-topbar"
        style={{ padding: isMobile ? "0 20px" : "0 clamp(32px,6vw,96px)" }}>
        <div className="od-logo" onClick={() => navigate("/dashboard")}>
          <span style={{ color: "#2D6A4F" }}>Tru</span>
          <span style={{ color: "#F0B429" }}>Goa</span>
        </div>

        <div className="od-topbar-center">
          {TABS.map(t => (
            <button
              key={t}
              className={`od-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t}
              {t === "Bookings" && pendingBookings.length > 0 && (
                <span className="od-tab-badge">{pendingBookings.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="od-topbar-right">
          <div className="od-owner-pill">
            <div className="od-owner-avatar">
              {owner?.name?.[0]?.toUpperCase()}
            </div>
            {!isMobile && (
              <span className="od-owner-name">{owner?.name?.split(" ")[0]}</span>
            )}
          </div>
          <button className="od-btn-add" onClick={() => navigate("/add-business")}>
            {isMobile ? "+" : "+ Add Listing"}
          </button>
          <button className="od-btn-logout" onClick={() => { logout(); navigate("/",{ replace: true}); }}>
            {isMobile ? "↩" : "Log Out"}
          </button>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════ */}
      {tab === "Overview" && (
        <div className="od-content"
          style={{ padding: isMobile ? "32px 20px 80px" : "48px clamp(32px,6vw,96px) 80px" }}>

          {/* Header */}
          <div className="od-overview-header">
            <div>
              <p className="od-eyebrow">Business Dashboard</p>
              <h1 className="od-title"
                style={{ fontSize: isMobile ? "clamp(36px,10vw,56px)" : "clamp(48px,5.5vw,80px)" }}>
               {getGreeting()},<br />
                <em>{owner?.name?.split(" ")[0]}.</em>
              </h1>
            </div>
            {pendingBookings.length > 0 && (
              <div className="od-alert-banner" onClick={() => setTab("Bookings")}>
                <span className="od-alert-dot" />
                <span>
                  <strong>{pendingBookings.length} new booking{pendingBookings.length > 1 ? "s" : ""}</strong>{" "}
                  awaiting your confirmation →
                </span>
              </div>
            )}
          </div>

          {/* Stats grid */}
          {stats && (
            <div className="od-stats-grid"
              style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
              {[
                { num: stats.totalListings,  label: "Total Listings",   sub: `${stats.approved} live`,        color: "#EEF5F1" },
                { num: stats.totalBookings,  label: "Total Bookings",   sub: `${stats.newBookings} pending`,   color: "#FEF8ED" },
                { num: stats.confirmed,      label: "Confirmed",        sub: "bookings",                       color: "#EEF5F1" },
                { num: stats.totalGuests,    label: "Total Guests",     sub: "served",                         color: "#EDE8DD" },
              ].map((s, i) => (
                <div key={i} className="od-stat-card" style={{ background: s.color }}>
                  <div className="od-stat-rule" />
                  <div className="od-stat-num">{s.num}</div>
                  <div className="od-stat-label">{s.label}</div>
                  <div className="od-stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent bookings preview */}
          <div className="od-section">
            <div className="od-section-header">
              <h2 className="od-section-title">Recent Bookings</h2>
              <button className="od-section-link" onClick={() => setTab("Bookings")}>
                View all →
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">📋</div>
                <p className="od-empty-title">No bookings yet</p>
                <p className="od-empty-sub">
                  When tourists book your places, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="od-bk-list">
                {bookings.slice(0, 5).map(b => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    onAction={(id) => { setActionId(id); setActionNote(""); setActionErr(null); }}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Listings preview */}
          <div className="od-section">
            <div className="od-section-header">
              <h2 className="od-section-title">Your Listings</h2>
              <button className="od-section-link" onClick={() => setTab("Listings")}>
                Manage →
              </button>
            </div>
            {businesses.length === 0 ? (
              <div className="od-empty">
                <div className="od-empty-icon">🏖️</div>
                <p className="od-empty-title">No listings yet</p>
                <p className="od-empty-sub">Add your first business to start receiving bookings.</p>
                <button className="od-btn-gold" onClick={() => navigate("/add-business")}>
                  Add Your First Listing
                </button>
              </div>
            ) : (
              <div className="od-listings-preview"
                style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {businesses.slice(0, 4).map(biz => (
                  <ListingCard key={biz._id} biz={biz} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════
          TAB: LISTINGS
      ══════════════════════════════════════════════════ */}
      {tab === "Listings" && (
        <div className="od-content"
          style={{ padding: isMobile ? "32px 20px 80px" : "48px clamp(32px,6vw,96px) 80px" }}>

          <div className="od-tab-header">
            <div>
              <p className="od-eyebrow">Your Properties</p>
              <h1 className="od-title"
                style={{ fontSize: isMobile ? "clamp(32px,9vw,52px)" : "clamp(40px,5vw,68px)" }}>
                Your Listings
              </h1>
            </div>
            <button className="od-btn-gold" onClick={() => navigate("/add-business")}>
              + Add New Listing
            </button>
          </div>

          {businesses.length === 0 ? (
            <div className="od-empty od-empty-full">
              <div className="od-empty-icon">🏖️</div>
              <p className="od-empty-title">No listings yet</p>
              <p className="od-empty-sub">Add your first business to start receiving bookings.</p>
              <button className="od-btn-gold" onClick={() => navigate("/add-business")}>
                Add Your First Listing
              </button>
            </div>
          ) : (
            <div className="od-listings-grid"
              style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {businesses.map(biz => (
                <ListingCard key={biz._id} biz={biz} isMobile={isMobile} full />
              ))}
            </div>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════════════
          TAB: BOOKINGS
      ══════════════════════════════════════════════════ */}
      {tab === "Bookings" && (
        <div className="od-content"
          style={{ padding: isMobile ? "32px 20px 80px" : "48px clamp(32px,6vw,96px) 80px" }}>

          <div className="od-tab-header">
            <div>
              <p className="od-eyebrow">Reservations</p>
              <h1 className="od-title"
                style={{ fontSize: isMobile ? "clamp(32px,9vw,52px)" : "clamp(40px,5vw,68px)" }}>
                All Bookings
              </h1>
            </div>
          </div>

          {/* Filter pills */}
          <div className="od-filters">
            {["all","pending","confirmed","rejected","cancelled","completed"].map(f => (
              <button key={f}
                className={`od-filter-btn ${bkFilter === f ? "active" : ""}`}
                onClick={() => setBkFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingBookings.length > 0 && (
                  <span className="od-filter-count">{pendingBookings.length}</span>
                )}
              </button>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div className="od-empty od-empty-full">
              <div className="od-empty-icon">📋</div>
              <p className="od-empty-title">
                {bkFilter === "all" ? "No bookings yet" : `No ${bkFilter} bookings`}
              </p>
              <p className="od-empty-sub">
                {bkFilter === "all"
                  ? "When tourists book your places, they'll appear here."
                  : "Nothing matching this filter."}
              </p>
              {bkFilter !== "all" && (
                <button className="od-btn-outline" onClick={() => setBkFilter("all")}>
                  Show all bookings
                </button>
              )}
            </div>
          ) : (
            <div className="od-bk-list">
              {bookings.map(b => (
                <BookingRow
                  key={b._id}
                  booking={b}
                  onAction={(id) => { setActionId(id); setActionNote(""); setActionErr(null); }}
                  isMobile={isMobile}
                  full
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── ACTION MODAL ─────────────────────────────────── */}
      {actionId && (() => {
        const bk = bookings.find(b => b._id === actionId);
        if (!bk) return null;
        return (
          <div className="od-modal-overlay" onClick={() => setActionId(null)}>
            <div className="od-modal" onClick={e => e.stopPropagation()}>
              <h3 className="od-modal-title">Respond to Booking</h3>
              <div className="od-modal-bk-info">
                <div className="od-modal-bk-name">{bk.business?.name || "—"}</div>
                <div className="od-modal-bk-meta">
                  {bk.customerName} · {bk.guests} guests ·{" "}
                  {new Date(bk.bookingDate).toLocaleDateString("en-IN", {
                    weekday:"short", day:"numeric", month:"short"
                  })} · {bk.timeSlot}
                </div>
                {bk.specialRequest && (
                  <div className="od-modal-bk-request">"{bk.specialRequest}"</div>
                )}
              </div>

              <div className="od-modal-field">
                <label className="od-modal-label">Note to customer (optional)</label>
                <textarea
                  className="od-modal-textarea"
                  placeholder="Add a note, special instructions, or reason for rejection…"
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  rows={3}
                />
              </div>

              {actionErr && (
                <div className="od-modal-error">{actionErr}</div>
              )}

              <div className="od-modal-actions">
                {bk.status === "pending" && (
                  <>
                    <button
                      className="od-btn-confirm"
                      onClick={() => handleAction(actionId, "confirmed")}
                      disabled={actioning}>
                      {actioning ? "…" : "✓ Confirm Booking"}
                    </button>
                    <button
                      className="od-btn-reject"
                      onClick={() => handleAction(actionId, "rejected")}
                      disabled={actioning}>
                      ✕ Decline
                    </button>
                  </>
                )}
                {bk.status === "confirmed" && (
                  <button
                    className="od-btn-confirm"
                    onClick={() => handleAction(actionId, "completed")}
                    disabled={actioning}>
                    ✓ Mark Completed
                  </button>
                )}
                <button className="od-btn-outline" onClick={() => setActionId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function BookingRow({ booking: b, onAction, isMobile, full }) {
  const s   = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
  const d   = new Date(b.bookingDate);
  const dateStr = d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  const canAct = ["pending","confirmed"].includes(b.status);

  return (
    <div className="od-bk-row">
      <div className="od-bk-dot" style={{ background: s.dot }} />
      <div className="od-bk-main">
        <div className="od-bk-top">
          <div>
            <span className="od-bk-status" style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
            <div className="od-bk-customer">{b.customerName || "Guest"}</div>
            {full && b.business?.name && (
              <div className="od-bk-place">{b.business.name}</div>
            )}
          </div>
          <div className="od-bk-ref">#{b._id?.slice(-6).toUpperCase()}</div>
        </div>
        <div className="od-bk-details">
          <span>📅 {dateStr}</span>
          <span>🕐 {b.timeSlot}</span>
          <span>👥 {b.guests} {b.guests === 1 ? "guest" : "guests"}</span>
          {b.customerEmail && !isMobile && <span>✉ {b.customerEmail}</span>}
          {b.customerPhone && !isMobile && <span>📞 {b.customerPhone}</span>}
        </div>
        {b.specialRequest && (
          <div className="od-bk-request">"{b.specialRequest}"</div>
        )}
        {b.internalNote && (
          <div className="od-bk-note">Note: {b.internalNote}</div>
        )}
      </div>
      {canAct && (
        <button className="od-bk-action-btn" onClick={() => onAction(b._id)}>
          Respond →
        </button>
      )}
    </div>
  );
}

function ListingCard({ biz, isMobile, full }) {
  const navigate = useNavigate();
  const s = LISTING_STATUS[biz.status] || LISTING_STATUS.pending;
  const img = biz.images?.[0];

  return (
    <div className={`od-listing-card ${full ? "od-listing-card-full" : ""}`}>
      <div className="od-listing-img"
        style={{ backgroundImage: img ? `url(${img})` : undefined, background: img ? undefined : "#EDE8DD" }}>
        {!img && <span style={{ fontSize: 32 }}>🏖️</span>}
        <span className="od-listing-status" style={{ background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>
      <div className="od-listing-body">
        <p className="od-listing-category">{biz.category || "Business"}</p>
        <h3 className="od-listing-name">{biz.name}</h3>
        <p className="od-listing-location">📍 {biz.location}</p>
        {full && (
          <div className="od-listing-meta">
            <span>⭐ {biz.rating || "—"}</span>
            <span>{biz.review_count || 0} reviews</span>
            {biz.price_range && <span>{biz.price_range}</span>}
          </div>
        )}
        {biz.status === "approved" && (
          <button
            className="od-listing-view-btn"
            onClick={() => navigate(`/listings/${biz._id}`)}>
            View Listing →
          </button>
        )}
        {biz.status === "pending" && (
          <div className="od-listing-pending-note">
            Under review by TruGoa team
          </div>
        )}
      </div>
    </div>
  );
}