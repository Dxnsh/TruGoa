import { useState, useRef, useEffect } from "react";
import { theme } from "../../Theme";
import { Badge, Alert, SurfaceCard, PrimaryButton } from "../../Theme";
import { sendChatMessage } from "../../services/api";
import useIsMobile from "../../hooks/useIsMobile";

const GOA_DATABASE = {
  taxiPrices: [
    { from: "Goa Airport (Dabolim)", to: "Panaji",        price: "₹600–₹800",   duration: "45 min" },
    { from: "Goa Airport (Dabolim)", to: "Baga Beach",    price: "₹900–₹1100",  duration: "55 min" },
    { from: "Goa Airport (Dabolim)", to: "Calangute",     price: "₹850–₹1050",  duration: "50 min" },
    { from: "Goa Airport (Dabolim)", to: "Anjuna",        price: "₹1000–₹1200", duration: "60 min" },
    { from: "Goa Airport (Dabolim)", to: "Colva Beach",   price: "₹400–₹550",   duration: "25 min" },
    { from: "Panaji",                to: "Baga Beach",    price: "₹350–₹500",   duration: "30 min" },
    { from: "Panaji",                to: "Old Goa",       price: "₹150–₹250",   duration: "15 min" },
    { from: "Calangute",             to: "Anjuna",        price: "₹200–₹300",   duration: "15 min" },
    { from: "Mapusa",                to: "Vagator",       price: "₹200–₹300",   duration: "20 min" },
    { from: "Margao",                to: "Colva Beach",   price: "₹150–₹200",   duration: "15 min" },
  ],
  places: [
    { name: "Britto's Restaurant",      category: "restaurant", area: "Baga Beach, North Goa",     budget: "₹400–₹800 per person",          rating: 4.3, verified: true,  localTip: "Go for the seafood thali. Avoid tandoori — not their specialty. Best before 1pm.", mustTry: "Prawn curry rice, Fish recheado",         scamAlert: null },
    { name: "Thalassa",                 category: "restaurant", area: "Vagator, North Goa",         budget: "₹800–₹1500 per person",         rating: 4.5, verified: true,  localTip: "Book in advance for sunset views. Greek food is genuinely authentic.",             mustTry: "Moussaka, Grilled octopus, Sangria",      scamAlert: null },
    { name: "Infantaria Cafe",          category: "cafe",       area: "Calangute, North Goa",       budget: "₹150–₹300 per person",          rating: 4.4, verified: true,  localTip: "Best breakfast in North Goa. Go 8–10am. Croissants and bebinca are legendary.",   mustTry: "Bebinca, Croissant, Goan sausage sandwich", scamAlert: null },
    { name: "Sunset Beach Shack",       category: "beach shack",area: "Anjuna Beach, North Goa",    budget: "₹200–₹500 per person",          rating: 4.1, verified: true,  localTip: "Ask for the daily fresh catch — not the printed menu. Never pay before eating.", mustTry: "Grilled kingfish, Feni cocktail",         scamAlert: "Some beach shacks overcharge tourists. Always ask price before ordering drinks." },
    { name: "Hotel Mandovi",            category: "hotel",      area: "Panaji, Goa",                budget: "₹2500–₹4000 per night",         rating: 4.2, verified: true,  localTip: "Great central location. Heritage property with Mandovi river views.",             mustTry: null,                                      scamAlert: null },
    { name: "Yoga Magic",               category: "stay",       area: "Anjuna, North Goa",          budget: "₹3000–₹6000 per night",         rating: 4.6, verified: true,  localTip: "Eco-tents in a jungle setting. Best for solo travelers. Book 2 weeks in advance.", mustTry: null,                                     scamAlert: null },
    { name: "Dudhsagar Waterfalls Trek",category: "activity",   area: "Mollem, South Goa",          budget: "₹800–₹1200 per person",         rating: 4.7, verified: true,  localTip: "Only Oct–May. Book a registered jeep from Mollem check post.",                   mustTry: null,                                      scamAlert: "Do NOT pay touts near the highway. Only book at the official Mollem check post." },
    { name: "Saturday Night Market",    category: "market",     area: "Arpora, North Goa",          budget: "Entry free, shopping ₹200–₹2000", rating: 4.4, verified: true, localTip: "Only Nov–April on Saturdays. Best for handmade crafts. Go after 7pm.",          mustTry: null,                                      scamAlert: "Bargain hard. First price is always 3x the real price." },
    { name: "Palolem Beach",            category: "beach",      area: "Canacona, South Goa",        budget: "Free entry",                    rating: 4.8, verified: true,  localTip: "Most beautiful beach in Goa. Less crowded than North. Visit early morning.",      mustTry: "Kayaking, Silent disco nights",           scamAlert: null },
  ],
  scamAlerts: [
    "Taxi drivers at airport may quote ₹2000+ for rides that should cost ₹600–₹800. Always use pre-paid taxi counters inside the airport.",
    "Fake tour operators sell 'exclusive' packages near tourist spots. Book only through hotels or government tourism offices.",
    "Drug peddlers on beaches target tourists. This is illegal and can lead to serious legal trouble.",
    "Some restaurants add 10–20% service charges without mentioning upfront. Always check the bill carefully.",
    "ATM skimming is reported in some areas. Use ATMs inside banks or well-known shops only.",
    "Unofficial money changers offer 'better rates' — illegal and risky. Use banks or authorized forex centers.",
  ],
  hiddenGems: [
    { name: "Butterfly Beach",       desc: "Accessible only by boat from Palolem. Completely untouched. Worth the ₹300 boat ride.", area: "South Goa" },
    { name: "Divar Island",          desc: "Take the free government ferry from Old Goa. Village life, old Portuguese churches, zero tourists.", area: "Central Goa" },
    { name: "Chapora Fort at Dawn",  desc: "Skip the sunset crowd. Visit at 6am — you'll have the fort to yourself.", area: "North Goa" },
    { name: "Cabo de Rama Fort",     desc: "Most tourists miss this. Ancient fort with ocean views on three sides. Completely free.", area: "South Goa" },
    { name: "Fontainhas Latin Quarter", desc: "Panaji's old Portuguese neighborhood. Beautiful colored houses, local cafes, street art.", area: "Panaji" },
  ],
};

const TABS = [
  { id: "chat",    icon: "💬", label: "Ask GoaGuide" },
  { id: "explore", icon: "🗺️", label: "Explore Places" },
  { id: "prices",  icon: "🚕", label: "Fair Prices" },
  { id: "alerts",  icon: "⚠️", label: "Scam Alerts" },
];

const QUICK_QUESTIONS = [
  "Fair taxi price from airport to Baga?",
  "Best budget restaurants in North Goa?",
  "Common scams tourists face in Goa?",
  "Hidden gems most tourists miss?",
  "Plan 3 days in Goa under ₹8000",
];

const CATEGORIES = ["all", "restaurant", "cafe", "hotel", "stay", "activity", "beach", "market"];
const CATEGORY_ICONS = { restaurant: "🍽️", cafe: "☕", hotel: "🏨", stay: "🏡", activity: "🎯", beach: "🏖️", market: "🛍️", all: "✨" };

export default function GoaGuide() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Namaskaar! 🌴 I'm GoaGuide AI — your trusted local companion for Goa. I know fair taxi prices, the best hidden spots, which places to avoid, and how to make the most of every rupee. What would you like to know?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const messagesEndRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];
      const { reply } = await sendChatMessage(conversationHistory);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const filteredPlaces = selectedCategory === "all"
    ? GOA_DATABASE.places
    : GOA_DATABASE.places.filter(p => p.category === selectedCategory);

  return (
    <div style={{
      fontFamily: theme.typography.fontBody,
      background: theme.colors.bgPage,
      minHeight: "100vh",
      color: theme.colors.textPrimary,
    }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.secondaryDark} 0%, ${theme.colors.secondary} 100%)`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 68,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: theme.colors.primary,
            borderRadius: theme.radii.md,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            🌴
          </div>
          <div>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 20,
              fontWeight: theme.typography.weightBlack,
              color: "white",
              letterSpacing: "-0.5px",
            }}>
              GoaGuide AI
            </div>
            <div style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              Your Trusted Local Companion
            </div>
          </div>
        </div>

        {/* live badge */}
        <div style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: theme.radii.pill,
          padding: "5px 14px",
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            width: 6, height: 6,
            background: "#4ade80",
            borderRadius: "50%",
            display: "inline-block",
            animation: "pulse 2s infinite",
          }} />
          Live · Goa Local Data
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────── */}
      <div style={{
        background: theme.colors.bgCard,
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        padding: "0 8px",
        display: "flex",
        overflowX: "auto",
        scrollbarWidth: "none",
        position: "sticky",
        top: isMobile ? 64 : 136,
        zIndex: 99,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${theme.colors.primary}`
                  : "2px solid transparent",
               padding: isMobile ? "12px 8px" : "14px 16px",
               flex: isMobile ? 1 : "none",
               justifyContent: isMobile ? "center" : "flex-start",
                cursor: "pointer",
                fontFamily: theme.typography.fontBody,
                fontSize: 13,
                fontWeight: isActive ? theme.typography.weightMedium : theme.typography.weightRegular,
                color: isActive ? theme.colors.primaryText : theme.colors.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                marginBottom: -1,
                transition: theme.transitions.fast,
              }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
            {isMobile ? tab.icon : `${tab.icon} ${tab.label}`}
            </button>
          );
        })}
      </div>

      {/* ── CHAT TAB ───────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 210px)" }}>

          {/* messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 16px",
            display: "flex", flexDirection: "column", gap: 16,
            background: theme.colors.bgPage,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: 10,
                alignItems: "flex-start",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 34, height: 34, minWidth: 34,
                    background: theme.colors.primary,
                    borderRadius: theme.radii.sm,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    🌴
                  </div>
                )}
                <div style={{
                  maxWidth: "78%",
                  background: msg.role === "user"
                    ? theme.colors.secondary
                    : theme.colors.bgCard,
                  border: msg.role === "user"
                    ? "none"
                    : `1px solid ${theme.colors.borderLight}`,
                  borderRadius: msg.role === "user"
                    ? `${theme.radii.lg} ${theme.radii.lg} 4px ${theme.radii.lg}`
                    : `${theme.radii.lg} ${theme.radii.lg} ${theme.radii.lg} 4px`,
                  padding: "12px 16px",
                  fontSize: 14,
                  lineHeight: theme.typography.lineHeightRelaxed,
                  color: msg.role === "user" ? "white" : theme.colors.textPrimary,
                  whiteSpace: "pre-wrap",
                  boxShadow: theme.shadows.card,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 34, height: 34,
                  background: theme.colors.primary,
                  borderRadius: theme.radii.sm,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  🌴
                </div>
                <div style={{
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: `${theme.radii.lg} ${theme.radii.lg} ${theme.radii.lg} 4px`,
                  padding: "14px 18px",
                  display: "flex", gap: 5, alignItems: "center",
                  boxShadow: theme.shadows.card,
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7,
                      background: theme.colors.primary,
                      borderRadius: "50%",
                      display: "block",
                      animation: "wave 1.4s ease-in-out infinite",
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* quick questions */}
          <div style={{
            padding: "10px 16px",
            display: "flex", gap: 8, overflowX: "auto",
            scrollbarWidth: "none",
            background: theme.colors.bgPage,
            borderTop: `1px solid ${theme.colors.borderLight}`,
          }}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{
                  background: theme.colors.primaryLight,
                  border: `1px solid ${theme.colors.primary}`,
                  borderRadius: theme.radii.pill,
                  padding: "7px 14px",
                  fontFamily: theme.typography.fontBody,
                  fontSize: 12,
                  color: theme.colors.primaryText,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontWeight: theme.typography.weightMedium,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fde68a"}
                onMouseLeave={e => e.currentTarget.style.background = theme.colors.primaryLight}
              >
                {q}
              </button>
            ))}
          </div>

          {/* input */}
          <div style={{
            padding: "12px 16px 20px",
            background: theme.colors.bgCard,
            borderTop: `1px solid ${theme.colors.borderLight}`,
            display: "flex", gap: 10,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about Goa..."
              style={{
                flex: 1,
                background: theme.colors.bgSurface,
                border: `1.5px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.lg,
                padding: "12px 16px",
                fontFamily: theme.typography.fontBody,
                fontSize: 14,
                color: theme.colors.textPrimary,
                outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = theme.colors.primary}
              onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
            />
            <button
              onClick={() => sendMessage()}
              style={{
                background: theme.colors.primary,
                border: "none",
                borderRadius: theme.radii.lg,
                width: 48, height: 48,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
                cursor: "pointer",
                transition: theme.transitions.normal,
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = theme.colors.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = theme.colors.primary}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── EXPLORE TAB ────────────────────────────────────── */}
      {activeTab === "explore" && (
        <div style={{ padding: 16, overflowY: "auto" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 22, fontWeight: theme.typography.weightBlack,
              color: theme.colors.textPrimary, marginBottom: 4,
            }}>
              Verified Places
            </h2>
            <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Personally verified by GoaGuide locals
            </p>
          </div>

          {/* category filter */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4, scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isActive ? theme.colors.primary : theme.colors.bgCard,
                    border: `1.5px solid ${isActive ? theme.colors.primary : theme.colors.borderLight}`,
                    borderRadius: theme.radii.pill,
                    padding: "6px 14px",
                    fontFamily: theme.typography.fontBody,
                    fontSize: 12,
                    color: isActive ? theme.colors.textPrimary : theme.colors.textBody,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: isActive ? theme.typography.weightMedium : theme.typography.weightRegular,
                    transition: theme.transitions.fast,
                  }}
                >
                  {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              );
            })}
          </div>

          {/* place cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredPlaces.map((place, i) => (
              <div key={i} style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.lg,
                padding: 18,
                boxShadow: theme.shadows.card,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 15,
                        fontWeight: theme.typography.weightMedium,
                        color: theme.colors.textPrimary,
                      }}>
                        {place.name}
                      </span>
                      {place.verified && <Badge variant="verified">✓ Verified</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {CATEGORY_ICONS[place.category]} {place.area}
                    </div>
                  </div>
                  <div style={{
                    background: theme.colors.primaryLight,
                    border: `1px solid ${theme.colors.primary}`,
                    borderRadius: theme.radii.md,
                    padding: "4px 10px",
                    fontSize: 13,
                    color: theme.colors.primaryText,
                    fontWeight: theme.typography.weightMedium,
                  }}>
                    ⭐ {place.rating}
                  </div>
                </div>

                <div style={{
                  background: theme.colors.bgSurface,
                  borderRadius: theme.radii.sm,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: theme.colors.textBody,
                  marginBottom: 10,
                }}>
                  💰 {place.budget}
                </div>

                <div style={{ fontSize: 13, color: theme.colors.textBody, lineHeight: 1.6, marginBottom: place.scamAlert ? 10 : 0 }}>
                  🧠 <em>{place.localTip}</em>
                </div>

                {place.mustTry && (
                  <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.secondary }}>
                    🍴 Must try: {place.mustTry}
                  </div>
                )}

                {place.scamAlert && (
                  <Alert variant="alert" style={{ marginTop: 10, borderRadius: theme.radii.sm }}>
                    ⚠️ {place.scamAlert}
                  </Alert>
                )}
              </div>
            ))}
          </div>

          {/* hidden gems */}
          <div style={{ marginTop: 28, marginBottom: 24 }}>
            <h3 style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 20, fontWeight: theme.typography.weightBold,
              color: theme.colors.secondary, marginBottom: 16,
            }}>
              🔮 Hidden Gems
            </h3>
            {GOA_DATABASE.hiddenGems.map((gem, i) => (
              <div key={i} style={{
                background: theme.colors.secondaryLight,
                border: `1px solid ${theme.colors.secondary}30`,
                borderRadius: theme.radii.lg,
                padding: 16,
                marginBottom: 12,
              }}>
                <div style={{
                  fontWeight: theme.typography.weightMedium,
                  fontSize: 15,
                  color: theme.colors.secondaryDark,
                  marginBottom: 4,
                }}>
                  {gem.name}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
                  📍 {gem.area}
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textBody, lineHeight: 1.6 }}>
                  {gem.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRICES TAB ─────────────────────────────────────── */}
      {activeTab === "prices" && (
        <div style={{ padding: 16, overflowY: "auto" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 22, fontWeight: theme.typography.weightBlack,
              color: theme.colors.textPrimary, marginBottom: 4,
            }}>
              Fair Taxi Prices
            </h2>
            <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Never get overcharged. These are the real local rates.
            </p>
          </div>

          <Alert variant="alert" style={{ marginBottom: 20, borderRadius: theme.radii.md }}>
            ⚠️ <strong>Important:</strong> Always use the pre-paid taxi counter inside Goa Airport.
            Outside touts will quote 2–3x the fair price. Show them this screen if needed.
          </Alert>

          {GOA_DATABASE.taxiPrices.map((route, i) => (
            <div key={i} style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.radii.lg,
              padding: 16,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: theme.shadows.card,
            }}>
              <div>
                <div style={{ fontSize: 13, color: theme.colors.textPrimary, fontWeight: theme.typography.weightMedium, marginBottom: 2 }}>
                  {route.from}
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, margin: "3px 0" }}>↓</div>
                <div style={{ fontSize: 13, color: theme.colors.textPrimary, fontWeight: theme.typography.weightMedium }}>
                  {route.to}
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                  🕐 {route.duration}
                </div>
              </div>
              <div style={{
                background: theme.colors.primaryLight,
                border: `1.5px solid ${theme.colors.primary}`,
                borderRadius: theme.radii.md,
                padding: "10px 16px",
                fontFamily: theme.typography.fontDisplay,
                fontSize: 16,
                fontWeight: theme.typography.weightBold,
                color: theme.colors.primaryText,
                textAlign: "center",
              }}>
                {route.price}
              </div>
            </div>
          ))}

          <Alert variant="success" style={{ marginTop: 8, borderRadius: theme.radii.md, lineHeight: 1.8 }}>
            <strong>💡 Pro Tips</strong><br />
            • Rent a scooter for ₹300–₹500/day to explore freely<br />
            • Rapido and GoaMiles app give fairer rates than roadside autos<br />
            • Always agree on price BEFORE getting in<br />
            • Night rates (after 11pm) are typically 1.5x the day rate
          </Alert>
        </div>
      )}

      {/* ── ALERTS TAB ─────────────────────────────────────── */}
      {activeTab === "alerts" && (
        <div style={{ padding: 16, overflowY: "auto" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 22, fontWeight: theme.typography.weightBlack,
              color: theme.colors.danger, marginBottom: 4,
            }}>
              ⚠️ Scam Alerts
            </h2>
            <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
              Stay safe. Know what to watch out for in Goa.
            </p>
          </div>

          {GOA_DATABASE.scamAlerts.map((alert, i) => (
            <Alert key={i} variant="danger" style={{ marginBottom: 12, borderRadius: theme.radii.md, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 26, height: 26, minWidth: 26,
                background: theme.colors.dangerBg,
                border: `1px solid ${theme.colors.danger}40`,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: theme.typography.weightBold,
                color: theme.colors.danger,
              }}>
                {i + 1}
              </div>
              <span style={{ lineHeight: 1.6 }}>{alert}</span>
            </Alert>
          ))}

          <div style={{
            background: theme.colors.secondaryLight,
            border: `1px solid ${theme.colors.secondary}30`,
            borderRadius: theme.radii.lg,
            padding: 16,
            marginTop: 8,
          }}>
            <div style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 16,
              fontWeight: theme.typography.weightBold,
              color: theme.colors.secondaryDark,
              marginBottom: 12,
            }}>
              ✅ Stay Safe in Goa
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textBody, lineHeight: 1.9 }}>
              • Save Goa Police helpline:{" "}
              <strong style={{ color: theme.colors.secondary }}>100</strong><br />
              • Tourist helpline:{" "}
              <strong style={{ color: theme.colors.secondary }}>1800-209-7767</strong><br />
              • Keep copies of your ID documents<br />
              • Share your location with trusted contacts<br />
              • Use GoaGuide AI for any suspicious price quotes
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes wave { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
      `}</style>

    </div>
  );
}