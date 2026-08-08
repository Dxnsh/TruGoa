import { MapPin, Lightbulb, ShieldCheck } from "lucide-react";
import { theme } from "../../Theme";

/**
 * Editorial listing card — matches the "Goa Edit" voice used on the
 * homepage and itinerary pages: serif place name, category eyebrow,
 * short editorial description, optional insider tip.
 *
 * Expected `biz` shape (from mapBusiness):
 *   id, name, location, category, image, trust ("verified" | ...)
 *
 * Optional fields — render only if present, no errors if missing:
 *   description   (1–2 sentence editorial blurb)
 *   insiderTip    (a specific local tip — table, time, what to avoid)
 *   tag           ("Hidden Gem" | "Local Favourite" | "Classic, Reimagined" | ...)
 *   priceIndicator ("₹" | "₹₹" | "₹₹₹")
 */
const BizCard = ({ biz }) => {
  const {
    name,
    location,
    category,
    image,
    trust,
    description,
    insiderTip,
    tag,
    priceIndicator,
  } = biz;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.radii.large || 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: theme.transitions.fast,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden" }}>
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />

        {/* category eyebrow, over the image */}
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            padding: "4px 12px",
            borderRadius: theme.radii.pill,
            background: "rgba(255,255,255,0.92)",
            fontSize: 11,
            fontWeight: theme.typography.weightMedium,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.colors.textBody,
          }}
        >
          {category}
        </span>

        {/* discovery tag — only if your data has it */}
        {tag && (
          <span
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              padding: "4px 12px",
              borderRadius: theme.radii.pill,
              background: theme.colors.primary,
              fontSize: 11,
              fontWeight: theme.typography.weightMedium,
              letterSpacing: "0.03em",
              color: "white",
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* name + trust */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <h3
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: 19,
              fontWeight: theme.typography.weightBold,
              color: theme.colors.textPrimary,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {name}
          </h3>
          {priceIndicator && (
            <span style={{ fontSize: 13, color: theme.colors.textMuted, whiteSpace: "nowrap", marginTop: 3 }}>
              {priceIndicator}
            </span>
          )}
        </div>

        {/* location */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: theme.colors.textMuted }}>
          <MapPin size={13} strokeWidth={2} />
          <span>{location}</span>
        </div>

        {/* editorial blurb, only if present */}
        {description && (
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: theme.colors.textBody,
              margin: "2px 0 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        )}

        {/* insider tip, only if present */}
        {insiderTip && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 8,
              background: theme.colors.primaryLight,
            }}
          >
            <Lightbulb size={14} strokeWidth={2} color={theme.colors.primary} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: theme.colors.primaryText }}>
              {insiderTip}
            </span>
          </div>
        )}

        {/* verified footer */}
        {trust === "verified" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 6,
              fontSize: 11.5,
              color: theme.colors.textMuted,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2} color={theme.colors.secondary} />
            <span>Locally verified by TruGoa</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BizCard;