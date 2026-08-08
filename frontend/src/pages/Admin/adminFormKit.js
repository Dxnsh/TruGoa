import { theme } from "../../Theme";
import { adminCreateBusiness, adminUpdateBusiness } from "../../services/api";

export const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: `1.5px solid ${theme.colors.borderLight}`,
  borderRadius: theme.radii.md, fontSize: 14,
  fontFamily: theme.typography.fontBody,
  color: theme.colors.textPrimary,
  background: "white",
};

export const labelStyle = {
  display: "block", fontSize: 12, fontWeight: theme.typography.weightBold,
  color: theme.colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
};

export const toList  = (str) => str.split(",").map(s => s.trim()).filter(Boolean);
export const toLines = (str) => str.split("\n").map(s => s.trim()).filter(Boolean);

export const saveBusiness = (business, payload) =>
  business?._id ? adminUpdateBusiness(business._id, payload) : adminCreateBusiness(payload);
