import { theme } from "../../../Theme";
import { labelStyle } from "../adminFormKit";

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
