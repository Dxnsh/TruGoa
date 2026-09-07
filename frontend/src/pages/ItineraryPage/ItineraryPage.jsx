import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../hooks/useIsMobile";
import { useTourist } from "../../context/TouristContext";
import { generateItinerary, getMyItinerary, saveMyItinerary } from "../../services/api";
import LoginModal from "../../components/LoginModal/LoginModal";
import SEO from "../../components/SEO/SEO";
import ItineraryMap, { DAY_COLORS } from "./ItineraryMap";
import {
  Waves,
  Landmark,
  Map,
  Music4,
  Heart,
  Compass,
  UtensilsCrossed,
  Palmtree,
  Coffee,
  ShoppingBag,
  Trees,
  Sailboat,
  Sparkles,
  Moon,
  Camera,
  Backpack,
  Users,
  Baby,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
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
  { value: "beach",     icon: Waves, label: "Beach & Chill",     desc: "Sunsets, shacks, hammocks, the sea" },
  { value: "heritage",  icon: Landmark, label: "Heritage & Culture",desc: "Latin Quarter, spice farms, old churches" },
  { value: "hidden",    icon: Map, label: "Off the Map",       desc: "Beaches only locals swim at, secret cafés" },
  { value: "party",     icon: Music4, label: "Party & Nightlife", desc: "Sunburn, Tito's, rooftop clubs, beach raves" },
  { value: "romantic",  icon: Heart, label: "Romantic",          desc: "Private dinners, sunset cruises, boutique villas" },
  { value: "adventure", icon: Compass, label: "Adventure",         desc: "Water sports, trekking, kayaking, paragliding" },
];

const INTERESTS = [
  { value: "food",       icon:UtensilsCrossed, label: "Food & Dining" },
  { value: "beaches",    icon: Palmtree,   label: "Beaches" },
  { value: "cafes",      icon:Coffee,      label: "Cafés & Coffee" },
  { value: "markets",    icon:ShoppingBag, label: "Flea Markets" },
  { value: "heritage",   icon:Landmark,  label: "Heritage & History" },
  { value: "nature",     icon:Trees,  label: "Nature & Spice Farms" },
  { value: "watersports", icon: Sailboat, label: "Water Sports" },
  { value: "yoga",        icon:Sparkles,  label: "Yoga & Wellness" },
  { value: "nightlife",   icon: Moon,  label: "Nightlife" },
  { value: "photo",      icon:Camera,  label: "Photography Spots" },
];

const TRAVEL_STYLES = [
  { value: "solo",    icon: Backpack,    label: "Solo",    desc: "Independent, flexible, meet new people" },
  { value: "couple",  icon: Heart,    label: "Couple",  desc: "Romantic evenings, private moments" },
  { value: "friends", icon: Users,    label: "Friends", desc: "Group activities, shared nights out" },
  { value: "family",  icon: Baby,  label: "Family",  desc: "Kid-friendly, safe areas, easy pace" },
];

const PERIOD_COLORS = { Morning: "#B86A00", Afternoon: "#1A5C38", Evening: "#4A2882", Night: "#3A2A6B" };

// Only ever show a real photo of the place — the one attached from its
// listing. No stand-in / category images: a stop with no listing photo shows
// a blank panel rather than a picture of somewhere else.
const slotImage = (slot) => slot?.image || null;

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
  const { isTouristLoggedIn, touristLoading } = useTourist();

  const [step, setStep]           = useState("checking");
  const [error, setError]         = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loadingLine, setLoadingLine] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    duration: "", budget: "", vibe: "", interests: [], style: "",
  });

  const isComplete = form.duration && form.budget && form.vibe
                  && form.interests.length > 0 && form.style;

  // The Itinerary Planner is account-only: signed-out tourists see a lock
  // screen instead of the form. Signing in restores their last saved
  // itinerary (if any); signing out resets everything back to the lock
  // screen rather than leaving old data visible.
  useEffect(() => {
    if (touristLoading) return;

    if (!isTouristLoggedIn) {
      setStep("locked");
      setItinerary(null);
      setForm({ duration: "", budget: "", vibe: "", interests: [], style: "" });
      return;
    }

    let cancelled = false;
    (async () => {
      setStep("checking");
      try {
        const saved = await getMyItinerary();
        if (cancelled) return;
        if (saved?.form && saved?.data) {
          setForm(saved.form);
          setItinerary(saved.data);
          setActiveDay(0);
          setSaved(true);
          setStep("result");
        } else {
          setStep("form");
        }
      } catch (e) {
        console.error("Failed to fetch saved itinerary", e);
        if (!cancelled) setStep("form");
      }
    })();
    return () => { cancelled = true; };
  }, [touristLoading, isTouristLoggedIn]);

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

  setStep("loading");
  setError(null);
  setSaved(false);

  try {
    const data = await generateItinerary(form);

    setItinerary(data);
    setActiveDay(0);
    setStep("result");

    // Persist to the account so the tourist sees this same itinerary next
    // time instead of it being lost or having to regenerate one.
    saveMyItinerary(form, data)
      .then(() => setSaved(true))
      .catch(e => console.error("Failed to save itinerary to account", e));
  } catch (e) {
    console.error(e);
    setError(
      "Something went wrong. Please try again."
    );
    setStep("form");
  }
};

  const handleSave = async () => {
    if (!itinerary) return;
    try {
      await saveMyItinerary(form, itinerary);
      setSaved(true);
    } catch (e) {
      console.error("Failed to save itinerary", e);
    }
  };

  /* ══════════════════════════════════════════════════════
     STEP: CHECKING (brief, while we look for a saved itinerary)
  ══════════════════════════════════════════════════════ */
  if (step === "checking") return (
    <div className="itin-form-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <SEO path="/itinerary" title="Plan Your Itinerary" noindex />
    </div>
  );

  /* ══════════════════════════════════════════════════════
     STEP: LOCKED (signed-out tourist)
  ══════════════════════════════════════════════════════ */
  if (step === "locked") return (
    <div className="itin-form-page">
      <div
        style={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: isMobile ? "40px 24px" : "64px 48px",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p className="itin-eyebrow">Your Goa, Your Way</p>
          <h1
            className="itin-form-title"
            style={{ fontSize: isMobile ? "clamp(36px,10vw,56px)" : "clamp(52px,6vw,80px)" }}
          >
            Sign in to plan<br /><em>your</em> Goa trip.
          </h1>
          <p className="itin-form-sub" style={{ margin: "0 auto 40px" }}>
            The Itinerary Planner lives on your account, so your trip is saved and waiting
            for you next time you visit — sign in to get started.
          </p>
          <button
            className="generate-btn ready"
            style={{ maxWidth: 320, margin: "0 auto" }}
            onClick={() => setShowLoginModal(true)}
          >
            Sign In to Continue →
          </button>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Sign in to plan your Goa trip"
        />
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════
     STEP: FORM
  ══════════════════════════════════════════════════════ */
  if (step === "form") return (
    <div className="itin-form-page">
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
                <span className="vibe-emoji">
                  <v.icon size={22} strokeWidth={1.8} />
                </span>
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
                    <int.icon size={16} strokeWidth={1.8} /><span>{int.label}</span>
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
                 <span className="style-emoji">
                    <s.icon size={20} strokeWidth={1.8} />
                  </span>
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
    const days = it.days || [];
    const day = days[activeDay] || days[0] || { slots: [] };
    const dayCount = days.length;
    const isFirstDay = activeDay <= 0;
    const isLastDay = activeDay >= dayCount - 1;

    const budgetSub = BUDGETS.find(b => b.value === form.budget)?.sub || "";
    const vibeLabel = VIBES.find(v => v.value === form.vibe)?.label || "";
    const badge = [`${form.duration} Days`, budgetSub, vibeLabel]
      .filter(Boolean).join(" · ");

    // Cover photo: the first real listing image in the trip, or nothing —
    // the cover falls back to its plain dark panel rather than a stand-in.
    const coverImage =
      days.flatMap(d => d.slots || []).find(s => s.image)?.image || null;

    const goToDay = (i) => {
      setActiveDay(i);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    };

    // A Google Maps route through a list of stops (a plain search when there's
    // only one) — built from place names + area, since Google geocodes those
    // fine and it works even for stops with no coordinates.
    const gmapsRoute = (slots) => {
      const stops = (slots || [])
        .map(s => `${s.place}${s.area ? `, ${s.area}` : ", Goa"}`)
        .map(encodeURIComponent);
      if (stops.length === 0) return "https://www.google.com/maps/search/?api=1&query=Goa";
      if (stops.length === 1)
        return `https://www.google.com/maps/search/?api=1&query=${stops[0]}`;
      return `https://www.google.com/maps/dir/${stops.join("/")}`;
    };

    const allSlots = days.flatMap(d => d.slots || []);
    const totalStops = allSlots.length;
    const pinnedCount = allSlots.filter(
      s => typeof s.latitude === "number" && typeof s.longitude === "number"
    ).length;
    const tripMapUrl = gmapsRoute(allSlots);

    return (
      <div className="ir-page" ref={resultRef}>

        {/* ── COVER RECAP ──────────────────────────── */}
        <header className="ir-cover">
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              className="ir-cover-img"
              onError={(e) => { e.currentTarget.hidden = true; }}
            />
          )}
          <div className="ir-cover-shade" />
          <div className="grain" />

          <div className="ir-cover-inner"
            style={{ padding: isMobile ? "20px 20px 0" : "26px clamp(32px,6vw,90px) 0" }}>
            <div className="ir-cover-top">
              <span className="ir-badge">{badge}</span>
              <button className="ir-edit"
                onClick={() => { setStep("form"); window.scrollTo(0, 0); }}>
                ← Edit
              </button>
            </div>

            <div className="ir-cover-main">
              <h1 className="ir-title"
                style={{ fontSize: isMobile ? "clamp(30px,8vw,42px)" : "clamp(40px,4.4vw,60px)" }}>
                {it.title}
              </h1>
              <p className="ir-tagline">{it.tagline}</p>
              <div className="ir-stats">
                <div className="ir-stat">
                  <span className="ir-stat-n">{form.duration}</span>
                  <span className="ir-stat-l">Days</span>
                </div>
                <span className="ir-stat-div" />
                <div className="ir-stat">
                  <span className="ir-stat-n">{it.totalBudget}</span>
                  <span className="ir-stat-l">Total estimate</span>
                </div>
                <span className="ir-stat-div" />
                <div className="ir-stat">
                  <span className="ir-stat-n">{it.bestSeason}</span>
                  <span className="ir-stat-l">Best season</span>
                </div>
              </div>
            </div>

            <nav className="ir-daytabs no-scrollbar">
              {days.map((d, i) => (
                <button key={i}
                  className={`ir-daytab ${i === activeDay ? "active" : ""}`}
                  onClick={() => goToDay(i)}>
                  <span className="ir-daytab-n">Day {d.day}</span>
                  <span className="ir-daytab-t">{d.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* ── BRIEF (mood + good to know) ──────────── */}
        <section className="ir-brief"
          style={{ padding: isMobile ? "40px 24px" : "56px clamp(48px,8vw,140px)" }}>
          <h2 className="ir-brief-head">{day.theme || it.coverMood}</h2>
          <div className="ir-brief-cols">
            {it.practicalNotes && (
              <div className="ir-brief-col">
                <span className="ir-brief-label">Good to know</span>
                <p>{it.practicalNotes}</p>
              </div>
            )}
            <div className="ir-brief-col">
              <span className="ir-brief-label">Pace</span>
              <p>{day.title}{day.dayCost ? ` · ${day.dayCost}` : ""}</p>
            </div>
          </div>
        </section>

        {/* ── TRIP MAP ─────────────────────────────── */}
        <section className="ir-mapsection"
          style={{ padding: isMobile ? "0 20px 8px" : "0 clamp(40px,7vw,120px) 8px" }}>
          <div className="ir-mapsection-head">
            <div>
              <span className="ir-brief-label">The whole trip</span>
              <p className="ir-mapsection-sub">
                {pinnedCount > 0
                  ? `${pinnedCount} of ${totalStops} stops mapped · Day ${day.day} highlighted`
                  : "Stops for this trip"}
              </p>
            </div>
            <a className="ir-mapbtn" href={tripMapUrl} target="_blank" rel="noreferrer">
              <MapPin size={13} strokeWidth={2} /> Open in Google Maps
              <ArrowUpRight size={13} strokeWidth={2} />
            </a>
          </div>

          <ItineraryMap days={days} activeDay={activeDay} onSelectDay={goToDay} />

          <div className="ir-maplegend">
            {days.map((d, i) => (
              <button key={i}
                className={`ir-maplegend-item ${i === activeDay ? "active" : ""}`}
                onClick={() => goToDay(i)}>
                <span className="ir-maplegend-dot"
                  style={{ background: DAY_COLORS[i % DAY_COLORS.length] }} />
                Day {d.day}
              </button>
            ))}
          </div>
        </section>

        {/* ── ACTIVE DAY ───────────────────────────── */}
        <section className="ir-day"
          style={{ padding: isMobile ? "40px 20px 72px" : "64px clamp(40px,7vw,120px) 96px" }}>
          <div className="ir-day-head">
            <div>
              <p className="ir-day-eyebrow">Day {day.day} of {dayCount}</p>
              <h2 className="ir-day-title"
                style={{ fontSize: isMobile ? "clamp(30px,8vw,40px)" : "clamp(38px,4vw,54px)" }}>
                {day.title}
              </h2>
              <p className="ir-day-theme">{day.theme}</p>
            </div>
            {day.dayCost && <span className="ir-day-cost">{day.dayCost}</span>}
          </div>

          <a className="ir-mapbtn" href={gmapsRoute(day.slots)} target="_blank" rel="noreferrer">
            <MapPin size={13} strokeWidth={2} /> Day {day.day} directions
            <ArrowUpRight size={13} strokeWidth={2} />
          </a>

          <div className="ir-slots">
            {(day.slots || []).map((slot, si) => (
              <article key={si} className="ir-slot">
                <span className="ir-slot-num">{String(si + 1).padStart(2, "0")}</span>

                {slotImage(slot) && (
                  <div className="ir-slot-media">
                    <img
                      src={slotImage(slot)}
                      alt={slot.place}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.closest(".ir-slot-media").hidden = true;
                      }}
                    />
                  </div>
                )}

                <div className="ir-slot-body">
                  <div className="ir-slot-meta">
                    <span className="ir-slot-time">{slot.time}</span>
                    <span className="ir-slot-metadot" />
                    <span className="ir-slot-type">{slot.type}</span>
                  </div>
                  {slot.period && (
                    <span className="ir-slot-period"
                      style={{ color: PERIOD_COLORS[slot.period], borderColor: PERIOD_COLORS[slot.period] }}>
                      {slot.period}
                    </span>
                  )}
                  {slot.slug
                    ? <h3 className="ir-slot-place">
                        <a
                          href={`/listings/${slot.slug}`}
                          onClick={(e) => { e.preventDefault(); navigate(`/listings/${slot.slug}`); }}
                        >
                          {slot.place}
                        </a>
                      </h3>
                    : <h3 className="ir-slot-place">{slot.place}</h3>}
                  {slot.area && (
                    <p className="ir-slot-area">
                      <MapPin size={12} strokeWidth={2} /> {slot.area}
                    </p>
                  )}
                  {slot.description && <p className="ir-slot-desc">{slot.description}</p>}
                  {slot.insiderTip && (
                    <div className="ir-slot-tip">
                      <MapPin size={13} strokeWidth={2.2} className="ir-slot-tip-icon" />
                      <span>{slot.insiderTip}</span>
                    </div>
                  )}
                  {slot.estimatedCost && (
                    <p className="ir-slot-cost">
                      Est. cost <strong>{slot.estimatedCost}</strong> per person
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="ir-nav">
            {!isFirstDay && (
              <button className="ir-nav-back" onClick={() => goToDay(activeDay - 1)}>
                <ArrowLeft size={15} strokeWidth={2} /> Back to Day {days[activeDay - 1].day}
              </button>
            )}
            {!isLastDay ? (
              <button className="ir-nav-next" onClick={() => goToDay(activeDay + 1)}>
                Continue to Day {days[activeDay + 1].day}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button className="ir-nav-save" onClick={handleSave} disabled={saved}>
                {saved ? "Itinerary saved ✓" : "Save this itinerary"}
              </button>
            )}
          </div>
        </section>

        {/* ── Footer */}
        <footer className="ir-foot"
          style={{ padding: isMobile ? "22px 24px" : "26px clamp(48px,8vw,140px)" }}>
          <span className="itin-logo" onClick={() => navigate("/")}>
            <span style={{ color: "#2D6A4F" }}>Tru</span>
            <span style={{ color: "#F0B429" }}>Goa</span>
          </span>
          <span className="ir-foot-tag">Simple plans. Memorable days.</span>
        </footer>
      </div>
    );
  }


  return null;
}