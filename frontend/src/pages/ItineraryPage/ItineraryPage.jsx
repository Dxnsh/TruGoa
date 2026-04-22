import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import "./ItineraryPage.css";

/* ─── constants ─────────────────────────────────────────── */
const DURATIONS = [
  { value: "2",  label: "2 Days",  sub: "Weekend escape" },
  { value: "3",  label: "3 Days",  sub: "Long weekend" },
  { value: "5",  label: "5 Days",  sub: "The sweet spot" },
  { value: "7",  label: "7 Days",  sub: "Full immersion" },
  { value: "10", label: "10 Days", sub: "Deep Goa" },
];

const BUDGETS = [
  { value: "budget",  label: "₹1,500/day",  sub: "Backpacker",  desc: "Local shacks, guesthouses, scooter hire" },
  { value: "mid",     label: "₹3,500/day",  sub: "Comfortable", desc: "Boutique stays, good restaurants, taxis" },
  { value: "premium", label: "₹7,000/day",  sub: "Premium",     desc: "Heritage villas, fine dining, curated tours" },
  { value: "luxury",  label: "₹15,000+/day",sub: "Luxury",      desc: "Private villas, chef experiences, concierge" },
];

const VIBES = [
  { value: "beach",     emoji: "🌊", label: "Beach & Chill",     desc: "Sunsets, shacks, hammocks, the sea" },
  { value: "heritage",  emoji: "🏛️", label: "Heritage & Culture",desc: "Latin Quarter, spice farms, old churches" },
  { value: "hidden",    emoji: "🗺️", label: "Off the Map",       desc: "Beaches only locals swim at, secret cafés" },
  { value: "party",     emoji: "🎶", label: "Party & Nightlife", desc: "Sunburn, Tito's, rooftop clubs, beach raves" },
  { value: "romantic",  emoji: "🌹", label: "Romantic",          desc: "Private dinners, sunset cruises, boutique villas" },
  { value: "adventure", emoji: "🏄", label: "Adventure",         desc: "Water sports, trekking, kayaking, paragliding" },
];

const INTERESTS = [
  { value: "food",       emoji: "🍽️", label: "Food & Dining" },
  { value: "beaches",    emoji: "🏖️", label: "Beaches" },
  { value: "cafes",      emoji: "☕",  label: "Cafés & Coffee" },
  { value: "markets",    emoji: "🛍️", label: "Flea Markets" },
  { value: "heritage",   emoji: "🕌",  label: "Heritage & History" },
  { value: "nature",     emoji: "🌿",  label: "Nature & Spice Farms" },
  { value: "watersports",emoji: "🤿",  label: "Water Sports" },
  { value: "yoga",       emoji: "🧘",  label: "Yoga & Wellness" },
  { value: "nightlife",  emoji: "🌙",  label: "Nightlife" },
  { value: "photo",      emoji: "📷",  label: "Photography Spots" },
];

const TRAVEL_STYLES = [
  { value: "solo",    emoji: "🎒",    label: "Solo",    desc: "Independent, flexible, meet new people" },
  { value: "couple",  emoji: "💑",    label: "Couple",  desc: "Romantic evenings, private moments" },
  { value: "friends", emoji: "👥",    label: "Friends", desc: "Group activities, shared nights out" },
  { value: "family",  emoji: "👨‍👩‍👧",  label: "Family",  desc: "Kid-friendly, safe areas, easy pace" },
];

const PERIOD_COLORS = { Morning: "#B86A00", Afternoon: "#1A5C38", Evening: "#4A2882" };
const PERIOD_BG     = { Morning: "#FDF3E0", Afternoon: "#E8F5EE", Evening: "#EDE6F8" };

const LOADING_LINES = [
  "Asking our local correspondents in Anjuna…",
  "Checking which beach shacks are open this season…",
  "Cross-referencing the taxi price index…",
  "Finding the café table with the best light…",
  "Confirming the sunset is still at 6:14 pm…",
  "Mapping the route that avoids the tourist traps…",
];

/* ─── prompt builder ─────────────────────────────────────── */
const buildPrompt = (form) => {
  const budgetLabels = {
    budget:  "₹1,500/day (backpacker)",
    mid:     "₹3,500/day (comfortable)",
    premium: "₹7,000/day (premium)",
    luxury:  "₹15,000+/day (luxury)",
  };
  const vibeLabel    = VIBES.find(v => v.value === form.vibe)?.label || form.vibe;
  const interests    = form.interests.map(v => INTERESTS.find(i => i.value === v)?.label).join(", ");
  const styleLabel   = TRAVEL_STYLES.find(s => s.value === form.style)?.label || form.style;

  return `You are a world-class Goa travel editor for a luxury Indian travel publication like Condé Nast Traveller India.
Create a deeply editorial, hyper-specific ${form.duration}-day Goa itinerary.

Traveller profile:
- Duration: ${form.duration} days
- Budget: ${budgetLabels[form.budget]}
- Vibe: ${vibeLabel}
- Interests: ${interests || "general travel"}
- Travel style: ${styleLabel}

Return ONLY a valid JSON object — no markdown, no extra text, just the JSON.

{
  "title": "evocative 5–7 word trip title e.g. 'Five Days in Slow Glorious North Goa'",
  "tagline": "one atmospheric sentence 25–35 words making someone feel the trip",
  "overview": "2–3 sentences about the character of this itinerary — editorial tone not bullet points",
  "coverMood": "3–5 evocative mood words e.g. 'Golden. Unhurried. Quietly extraordinary.'",
  "totalBudget": "total estimated cost range for whole trip e.g. ₹14,000–₹18,000",
  "bestSeason": "e.g. October–March",
  "practicalNotes": "2–3 short specific practical tips for this exact traveller profile",
  "days": [
    {
      "day": 1,
      "title": "editorial day title 4–6 words evocative",
      "theme": "one-line day mood e.g. Arrive slow. Let Goa find you.",
      "dayCost": "estimated spend for this day e.g. ₹2,800–₹3,500",
      "slots": [
        {
          "time": "9:00 AM",
          "period": "Morning",
          "place": "exact real place name",
          "area": "neighbourhood e.g. Fontainhas Panaji",
          "type": "Café or Beach or Restaurant or Market or Activity or Heritage or Bar",
          "description": "2–3 sentences editorial first-person style with specific sensory details real dishes specific spots within the place what time of day feels best",
          "insiderTip": "one specific local insight a table a dish a time of day what to avoid",
          "estimatedCost": "e.g. ₹350–₹500 per person"
        }
      ]
    }
  ]
}

Rules:
- Use REAL specific Goa places: Thalassa, Ritz Classic, Café Bodega, Curlies, Palolem, Arambol, Brittos, Gunpowder, Antares, etc.
- Match every recommendation to the budget tier
- 3–5 slots per day depending on duration and pace
- Every description must feel written by a travel editor who has been there
- Insider tips must be genuinely useful and specific not generic
- Spread across appropriate north or south Goa based on vibe
- Include mix of Morning Afternoon Evening periods`;
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ItineraryPage() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const resultRef = useRef(null);

  const [step, setStep]           = useState("form");
  const [error, setError]         = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loadingLine, setLoadingLine] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  const [form, setForm] = useState({
    duration: "", budget: "", vibe: "", interests: [], style: "",
  });

  const isComplete = form.duration && form.budget && form.vibe
                  && form.interests.length > 0 && form.style;

  useEffect(() => {
    if (step !== "loading") return;
    const id = setInterval(() =>
      setLoadingLine(l => (l + 1) % LOADING_LINES.length), 2200);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step === "result" && resultRef.current)
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const toggleInterest = (val) =>
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val)
        ? f.interests.filter(i => i !== val)
        : f.interests.length < 5 ? [...f.interests, val] : f.interests,
    }));

  /* ── generate ──────────────────────────────────────────── */
  const generate = async () => {
    if (!isComplete) return;
    setStep("loading"); setError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: buildPrompt(form) }] }),
      });
      if (!res.ok) throw new Error("API " + res.status);
      const data = await res.json();

      const raw   = data?.content?.find?.(b => b.type === "text")?.text
                 || data?.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setItinerary(parsed);
      setActiveDay(0);
      setStep("result");
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  /* ══════════════════════════════════════════════════════
     STEP: FORM
  ══════════════════════════════════════════════════════ */
  if (step === "form") return (
    <div className="itin-form-page">

      <div className="itin-topbar" style={{ padding: isMobile ? "0 24px" : "0 clamp(48px,8vw,140px)" }}>
        <span className="itin-logo" onClick={() => navigate("/")}>
          <span style={{ color: "#2D6A4F" }}>Tru</span><span style={{ color: "#F0B429" }}>Goa</span>
        </span>
        <span className="itin-topbar-label">ITINERARY BUILDER</span>
      </div>

      <div className="itin-form-inner"
        style={{ padding: isMobile ? "40px 24px 120px" : "64px clamp(48px,8vw,140px) 120px" }}>

        {/* ── Header */}
        <div className="itin-form-header">
          <p className="itin-eyebrow">Your Goa, Your Way</p>
          <h1 className="itin-form-title"
            style={{ fontSize: isMobile ? "clamp(44px,12vw,72px)" : "clamp(72px,7.5vw,112px)" }}>
            Plan your<em> perfect</em><br />Goa trip.
          </h1>
          <p className="itin-form-sub">
            Tell us who you are and what you're after. Our AI — trained on local knowledge,
            real prices and insider routes — will craft your personal Goa itinerary.
          </p>
        </div>

        <div className="form-rule" />

        {/* ── 01 Duration */}
        <section className="form-section">
          <div className="form-section-num">01</div>
          <div className="form-section-body">
            <h2 className="form-section-title">How long are you staying?</h2>
            <div className="dur-grid">
              {DURATIONS.map(d => (
                <button key={d.value}
                  className={`dur-btn ${form.duration === d.value ? "active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, duration: d.value }))}>
                  <span className="dur-num">{d.label}</span>
                  <span className="dur-sub">{d.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="form-rule" />

        {/* ── 02 Budget */}
        <section className="form-section">
          <div className="form-section-num">02</div>
          <div className="form-section-body">
            <h2 className="form-section-title">What's your daily budget?</h2>
            <div className="budget-grid"
              style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
              {BUDGETS.map(b => (
                <button key={b.value}
                  className={`budget-btn ${form.budget === b.value ? "active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, budget: b.value }))}>
                  <span className="budget-amount">{b.label}</span>
                  <span className="budget-tier">{b.sub}</span>
                  <span className="budget-desc">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="form-rule" />

        {/* ── 03 Vibe */}
        <section className="form-section">
          <div className="form-section-num">03</div>
          <div className="form-section-body">
            <h2 className="form-section-title">What kind of Goa are you after?</h2>
            <div className="vibe-grid"
              style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)" }}>
              {VIBES.map(v => (
                <button key={v.value}
                  className={`vibe-btn ${form.vibe === v.value ? "active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, vibe: v.value }))}>
                  <span className="vibe-emoji">{v.emoji}</span>
                  <span className="vibe-label">{v.label}</span>
                  <span className="vibe-desc">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="form-rule" />

        {/* ── 04 Interests */}
        <section className="form-section">
          <div className="form-section-num">04</div>
          <div className="form-section-body">
            <h2 className="form-section-title">
              What do you want to do?
              <span className="form-hint"> Pick up to 5</span>
            </h2>
            <div className="interests-wrap">
              {INTERESTS.map(int => {
                const sel      = form.interests.includes(int.value);
                const capped   = !sel && form.interests.length >= 5;
                return (
                  <button key={int.value}
                    className={`interest-chip ${sel ? "active" : ""} ${capped ? "capped" : ""}`}
                    onClick={() => toggleInterest(int.value)}>
                    <span>{int.emoji}</span><span>{int.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="form-rule" />

        {/* ── 05 Travel Style */}
        <section className="form-section">
          <div className="form-section-num">05</div>
          <div className="form-section-body">
            <h2 className="form-section-title">Who are you travelling with?</h2>
            <div className="style-grid"
              style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
              {TRAVEL_STYLES.map(s => (
                <button key={s.value}
                  className={`style-btn ${form.style === s.value ? "active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}>
                  <span className="style-emoji">{s.emoji}</span>
                  <span className="style-label">{s.label}</span>
                  <span className="style-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <p className="itin-error">{error}</p>}

        {/* ── Generate CTA */}
        <div className="generate-wrap">
          <div className="completeness-row">
            {[
              { label: "Duration",     done: !!form.duration },
              { label: "Budget",       done: !!form.budget },
              { label: "Vibe",         done: !!form.vibe },
              { label: "Interests",    done: form.interests.length > 0 },
              { label: "Travel style", done: !!form.style },
            ].map(f => (
              <span key={f.label} className={`cpill ${f.done ? "done" : ""}`}>
                {f.done ? "✓" : "○"} {f.label}
              </span>
            ))}
          </div>
          <button
            className={`generate-btn ${isComplete ? "ready" : ""}`}
            onClick={generate}
            disabled={!isComplete}>
            {isComplete ? "Generate My Itinerary →" : "Complete all 5 fields to continue"}
          </button>
          <p className="generate-note">
            Powered by Claude AI · Built on 500+ verified Goa listings
          </p>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     STEP: LOADING
  ══════════════════════════════════════════════════════ */
  if (step === "loading") return (
    <div className="itin-loading-page">
      <div className="loading-glow-1" />
      <div className="loading-glow-2" />
      <div className="loading-content">
        <div className="loading-logo">
          <span style={{ color: "#2D6A4F" }}>Tru</span>
          <span style={{ color: "#F0B429" }}>Goa</span>
        </div>
        <div className="loading-spinner-wrap">
          <div className="loading-ring" />
          <div className="loading-ring r2" />
          <div className="loading-palm">🌴</div>
        </div>
        <p className="loading-label">Writing your itinerary</p>
        <p className="loading-line" key={loadingLine}>{LOADING_LINES[loadingLine]}</p>
        <p className="loading-profile">
          {form.duration} days &nbsp;·&nbsp; {BUDGETS.find(b => b.value === form.budget)?.sub}
          &nbsp;·&nbsp; {VIBES.find(v => v.value === form.vibe)?.label}
        </p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     STEP: RESULT
  ══════════════════════════════════════════════════════ */
  if (step === "result" && itinerary) {
    const it = itinerary;

    return (
      <div className="itin-result-page" ref={resultRef}>

        {/* ── COVER ─────────────────────────────────── */}
        <div className="itin-cover"
          style={{ minHeight: isMobile ? "72svh" : "90svh" }}>
          <div className="itin-cover-bg" />
          <div className="itin-cover-overlay" />
          <div className="grain" />

          {/* top meta */}
          <div className="cover-meta"
            style={{ padding: isMobile ? "0 24px" : "0 clamp(48px,8vw,140px)" }}>
            <span className="cover-meta-text">TRUGOA · PERSONAL ITINERARY</span>
            <button className="cover-edit-btn" onClick={() => { setStep("form"); window.scrollTo(0,0); }}>
              ← Edit Preferences
            </button>
          </div>

          {/* main editorial text — bottom anchored */}
          <div className="cover-content"
            style={{
              left:    isMobile ? 24 : "clamp(48px,8vw,140px)",
              right:   isMobile ? 24 : "auto",
              bottom:  isMobile ? 72 : 100,
              maxWidth: isMobile ? "calc(100% - 48px)" : "58%",
            }}>
            <div className="cover-eyebrow-row">
              <span className="cover-eyebrow-line" />
              <span className="cover-eyebrow-text">
                {form.duration} Days &nbsp;·&nbsp;
                {BUDGETS.find(b => b.value === form.budget)?.sub} &nbsp;·&nbsp;
                {VIBES.find(v => v.value === form.vibe)?.label}
              </span>
            </div>
            <h1 className="cover-h1"
              style={{ fontSize: isMobile ? "clamp(44px,12vw,68px)" : "clamp(62px,7.5vw,108px)" }}>
              {it.title}
            </h1>
            <p className="cover-tagline">{it.tagline}</p>
            <div className="cover-stats">
              <div className="cover-stat">
                <span className="cstat-num">{form.duration}</span>
                <span className="cstat-label">Days</span>
              </div>
              <div className="cstat-rule" />
              <div className="cover-stat">
                <span className="cstat-num">{it.totalBudget}</span>
                <span className="cstat-label">Total estimate</span>
              </div>
              <div className="cstat-rule" />
              <div className="cover-stat">
                <span className="cstat-num">{it.bestSeason}</span>
                <span className="cstat-label">Best season</span>
              </div>
            </div>
          </div>

          {/* frosted day-nav bar */}
          <nav className="cover-day-nav no-scrollbar">
            {it.days?.map((d, i) => (
              <button key={i}
                className={`day-nav-btn ${activeDay === i ? "active" : ""}`}
                onClick={() => {
                  setActiveDay(i);
                  document.getElementById(`day-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}>
                <span className="dnav-num">Day {d.day}</span>
                <span className="dnav-title">{d.title}</span>
              </button>
            ))}
          </nav>
        </div>


        {/* ── OVERVIEW ───────────────────────────── */}
        <div className="itin-overview"
          style={{ padding: isMobile ? "64px 24px" : "96px clamp(48px,8vw,140px)" }}>
          <div className="overview-inner"
            style={{ flexDirection: isMobile ? "column" : "row" }}>
            <div className="overview-left">
              <p className="eyebrow-dark-sm">About This Itinerary</p>
              <blockquote className="overview-quote">{it.overview}</blockquote>
            </div>
            {!isMobile && <div className="overview-vdivider" />}
            <div className="overview-right">
              <p className="eyebrow-dark-sm">Practical Notes</p>
              <p className="overview-notes">{it.practicalNotes}</p>
              <div className="overview-mood">
                <span className="mood-label">Mood</span>
                <span className="mood-value">{it.coverMood}</span>
              </div>
            </div>
          </div>
        </div>


        {/* ── DAYS ───────────────────────────────── */}
        {it.days?.map((day, di) => (
          <section key={di} id={`day-${di}`}
            className={`itin-day ${di % 2 === 0 ? "day-bg-light" : "day-bg-cream"}`}
            style={{ padding: isMobile ? "72px 24px" : "96px clamp(48px,8vw,140px)" }}>

            {/* Day header */}
            <div className="day-header">
              <div className="day-bignum"
                style={{ fontSize: isMobile ? "clamp(80px,22vw,160px)" : "clamp(120px,14vw,200px)" }}>
                {String(day.day).padStart(2, "0")}
              </div>
              <div className="day-header-text">
                <p className="day-eyebrow">Day {day.day} of {it.days.length}</p>
                <h2 className="day-title"
                  style={{ fontSize: isMobile ? "clamp(32px,9vw,52px)" : "clamp(42px,5vw,68px)" }}>
                  {day.title}
                </h2>
                <p className="day-theme">{day.theme}</p>
              </div>
              <div className="day-cost-tag">{day.dayCost}</div>
            </div>

            <div className="day-rule" />

            {/* Timeline */}
            <div className="timeline">
              {day.slots?.map((slot, si) => (
                <div key={si} className="tl-slot">

                  {/* Time column */}
                  <div className="tl-time-col">
                    <span className="tl-time">{slot.time}</span>
                    <span className="tl-period"
                      style={{ background: PERIOD_BG[slot.period], color: PERIOD_COLORS[slot.period] }}>
                      {slot.period}
                    </span>
                  </div>

                  {/* Track */}
                  <div className="tl-track">
                    <div className="tl-dot" />
                    {si < day.slots.length - 1 && <div className="tl-line" />}
                  </div>

                  {/* Content */}
                  <div className="tl-content">
                    <span className="tl-type">{slot.type}</span>
                    <h3 className="tl-place">{slot.place}</h3>
                    <span className="tl-area">📍 {slot.area}</span>
                    <p className="tl-desc">{slot.description}</p>
                    <div className="tl-footer">
                      {slot.insiderTip && (
                        <div className="tl-tip">
                          <span className="tl-tip-icon">💡</span>
                          <span className="tl-tip-text">{slot.insiderTip}</span>
                        </div>
                      )}
                      {slot.estimatedCost && (
                        <div className="tl-cost">
                          <span className="tl-cost-label">Est. cost</span>
                          <span className="tl-cost-val">{slot.estimatedCost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </section>
        ))}


        {/* ── END SPREAD ─────────────────────────── */}
        <div className="itin-end"
          style={{ padding: isMobile ? "72px 24px" : "96px clamp(48px,8vw,140px)" }}>
          <p className="eyebrow-light-sm">Your Journey Awaits</p>
          <h2 className="end-title"
            style={{ fontSize: isMobile ? "clamp(38px,10vw,56px)" : "clamp(50px,5.5vw,80px)" }}>
            {it.totalBudget} total,<br />
            <em>priceless memories.</em>
          </h2>
          <p className="end-sub">
            Every place here is verified by TruGoa's local team. Prices are honest.
            Tips are real. This is Goa as the locals live it.
          </p>
          <div className="end-actions">
            <button className="btn-gold" onClick={() => window.print()}>🖨 Print Itinerary</button>
            <button className="btn-outline-dark" onClick={() => { setStep("form"); window.scrollTo(0,0); }}>↻ Build Another</button>
            <button className="btn-outline-dark" onClick={() => navigate("/listings")}>Explore Listings →</button>
          </div>
        </div>

        {/* ── Footer */}
        <div className="itin-foot"
          style={{ padding: isMobile ? "24px" : `28px clamp(48px,8vw,140px)` }}>
          <span className="itin-logo" onClick={() => navigate("/")}>
            <span style={{ color: "#2D6A4F" }}>Tru</span>
            <span style={{ color: "#F0B429" }}>Goa</span>
          </span>
          <span className="itin-foot-note">© 2025 TruGoa · AI-powered, locally verified</span>
        </div>

      </div>
    );
  }

  return null;
}