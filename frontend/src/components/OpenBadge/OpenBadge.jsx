import { theme } from "../../Theme";
import useOpenNow from "../../hooks/useOpenNow";
import { Clock } from "lucide-react";

/**
 * "Open now" / "Closes 10 PM" / "Opens 6 PM" pill.
 *
 * Reads open-state from the place (recomputed every minute by useOpenNow, so a
 * long-lived tab stays accurate) and renders nothing when hours are unknown —
 * an unmigrated listing carries no badge rather than a misleading one.
 *
 * Props:
 *   place    — a mapped business ({ openingHours, openStatus, ... })
 *   variant  — "onImage" (translucent, for photo overlays) | "inline" (default)
 *   size     — "sm" (default) | "md"
 *   showIcon — clock glyph, default true
 */
const TONE_STYLES = {
  // Forest green — the app's success token.
  open: {
    inline: { bg: theme.colors.successBg, fg: theme.colors.success, dot: theme.colors.success },
    onImage: { bg: "rgba(45,106,79,0.92)", fg: "#fff", dot: "#fff" },
  },
  // Amber — the app's warning token. Used only in the last 30 min before close.
  "closing-soon": {
    inline: { bg: theme.colors.warningBg, fg: theme.colors.primaryText, dot: theme.colors.warning },
    onImage: { bg: "rgba(212,150,10,0.94)", fg: "#fff", dot: "#fff" },
  },
  // Warm neutral — visibly muted, never alarming. Planning ahead is fine.
  closed: {
    inline: { bg: theme.colors.bgSurface, fg: theme.colors.textMuted, dot: theme.colors.textMuted },
    onImage: { bg: "rgba(26,31,28,0.62)", fg: "rgba(255,255,255,0.92)", dot: "rgba(255,255,255,0.7)" },
  },
};

const OpenBadge = ({ place, variant = "inline", size = "sm", showIcon = true }) => {
  const { label, tone } = useOpenNow(place);
  if (!label || !tone) return null;

  const palette = (TONE_STYLES[tone] || TONE_STYLES.closed)[variant] || TONE_STYLES.closed.inline;
  const pad = size === "md" ? "5px 11px" : "3px 9px";
  const fontSize = size === "md" ? 12 : 10.5;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        borderRadius: theme.radii.pill,
        background: palette.bg,
        color: palette.fg,
        fontFamily: theme.typography.fontBody,
        fontSize,
        fontWeight: theme.typography.weightMedium,
        letterSpacing: "0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        backdropFilter: variant === "onImage" ? "blur(2px)" : undefined,
      }}
    >
      {showIcon && tone === "open" ? (
        <span
          aria-hidden="true"
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: palette.dot, flexShrink: 0,
          }}
        />
      ) : showIcon ? (
        <Clock size={size === "md" ? 12 : 10} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      ) : null}
      {label}
    </span>
  );
};

export default OpenBadge;
