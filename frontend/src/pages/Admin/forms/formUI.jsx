import { useState } from "react";
import { theme } from "../../../Theme";
import {
  labelStyle, inputStyle,
  parseCoordinates, isShortMapLink, isInGoa, formatCoordinates,
} from "../adminFormKit";

export const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

export const SectionHeading = ({ children }) => (
  <div style={{
    fontSize: 12, fontWeight: theme.typography.weightBold, color: theme.colors.primary,
    textTransform: "uppercase", letterSpacing: "0.06em", margin: "28px 0 14px",
    paddingBottom: 8, borderBottom: `1px solid ${theme.colors.borderLight}`,
  }}>
    {children}
  </div>
);

// A listing with no pin is invisible to the "near me" deck — $geoNear can only
// see documents that have coordinates — so this sits in every listing form
// rather than being tucked away as an advanced option. It accepts anything
// Google Maps hands you and does the extracting itself; see parseCoordinates.
export const PinField = ({ latitude, longitude, mapUrl, onChange }) => {
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState(null);

  const pinned = typeof latitude === "number" && typeof longitude === "number";
  const offMap = pinned && !isInGoa({ lat: latitude, lng: longitude });

  // Most listings already carry a Maps URL, and some of those have the
  // coordinates sitting in them. Offering it as one click beats making someone
  // fetch the same link again — but it stays an offer rather than filling
  // itself in, because a URL can point somewhere the listing doesn't.
  const fromUrl = !pinned && mapUrl ? parseCoordinates(mapUrl) : null;

  const apply = (text) => {
    setDraft(text);
    if (!text.trim()) { setNote(null); return; }

    const found = parseCoordinates(text);
    if (!found) {
      setNote(
        isShortMapLink(text)
          ? "Short Maps links don't carry the coordinates. Open it first, then copy the full URL from the address bar."
          : 'No coordinates in that. Paste a Google Maps URL, or type them directly as "15.5439, 73.7553".'
      );
      return;
    }

    onChange(found.lat, found.lng);
    setDraft("");   // the pin below is the confirmation; leaving the paste in place just clutters
    setNote(null);
  };

  return (
    <Field label="Map Pin">
      {pinned ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
          padding: "9px 12px", borderRadius: theme.radii.md,
          background: offMap ? theme.colors.dangerBg : theme.colors.bgSurface,
          border: `1px solid ${offMap ? `${theme.colors.danger}40` : theme.colors.borderLight}`,
        }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ flex: 1, fontSize: 13, color: theme.colors.textPrimary }}>
            {formatCoordinates(latitude, longitude)}
            {offMap && (
              <span style={{ display: "block", fontSize: 11.5, color: theme.colors.danger, marginTop: 2 }}>
                That&rsquo;s outside Goa — are the two numbers the right way round?
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => { onChange(null, null); setNote(null); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: theme.colors.textMuted,
              fontFamily: theme.typography.fontBody,
            }}
          >
            Clear
          </button>
        </div>
      ) : null}

      <input
        style={inputStyle}
        value={draft}
        onChange={(e) => apply(e.target.value)}
        placeholder={pinned ? "Paste a new Maps link to move the pin" : "Paste a Google Maps link, or 15.5439, 73.7553"}
      />

      {fromUrl && (
        <button
          type="button"
          onClick={() => onChange(fromUrl.lat, fromUrl.lng)}
          style={{
            display: "block", width: "100%", marginTop: 8, padding: "9px 12px",
            borderRadius: theme.radii.md, cursor: "pointer", textAlign: "left",
            border: `1.5px dashed ${theme.colors.secondary}`,
            background: theme.colors.secondaryLight,
            color: theme.colors.secondaryText,
            fontFamily: theme.typography.fontBody, fontSize: 12.5,
          }}
        >
          Use the pin from the Maps URL above — {formatCoordinates(fromUrl.lat, fromUrl.lng)}
        </button>
      )}

      <p style={{
        fontSize: 11.5, lineHeight: 1.55, marginTop: 6,
        color: note ? theme.colors.danger : theme.colors.textMuted,
      }}>
        {note || (pinned
          ? "This is what puts the place on the “near me” deck."
          : "Without a pin this place can’t appear in nearby search — only in browse.")}
      </p>
    </Field>
  );
};

export const Row = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
    {children}
  </div>
);

export const ModalShell = ({ title, onClose, onSubmit, error, saving, saveLabel, children }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 900 }} />
    <div style={{
      position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 901, background: "white", borderRadius: theme.radii.xl,
      width: "92%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto",
      boxShadow: theme.shadows.modal, border: `1px solid ${theme.colors.borderLight}`,
      fontFamily: theme.typography.fontBody,
    }}>
      <div style={{
        position: "sticky", top: 0, background: "white", zIndex: 1,
        padding: "20px 28px", borderBottom: `1px solid ${theme.colors.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h2 style={{
          fontFamily: theme.typography.fontDisplay, fontSize: 20,
          fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, margin: 0,
        }}>
          {title}
        </h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: theme.colors.textMuted, cursor: "pointer" }}>✕</button>
      </div>

      <form onSubmit={onSubmit} style={{ padding: "24px 28px 28px" }}>
        {children}

        {error && (
          <div style={{
            background: theme.colors.dangerBg, border: `1px solid ${theme.colors.danger}40`,
            borderRadius: theme.radii.md, padding: "10px 14px", fontSize: 13,
            color: theme.colors.danger, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{
            background: "none", border: `1.5px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.md, padding: "12px 22px", fontSize: 14,
            fontWeight: theme.typography.weightMedium, color: theme.colors.textBody,
            cursor: "pointer", fontFamily: theme.typography.fontBody,
          }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{
            background: saving ? theme.colors.borderLight : theme.colors.primary,
            border: "none", borderRadius: theme.radii.md, padding: "12px 26px", fontSize: 14,
            fontWeight: theme.typography.weightBold, color: "white",
            cursor: saving ? "not-allowed" : "pointer", fontFamily: theme.typography.fontBody,
          }}>
            {saving ? "Saving..." : saveLabel}
          </button>
        </div>
      </form>
    </div>
  </>
);
