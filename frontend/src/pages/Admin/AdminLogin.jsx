import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../services/api";
import { theme } from "../../Theme";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { token } = await adminLogin(form.email, form.password);
      localStorage.setItem("trugoa_admin_token", token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.colors.bgDark,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: theme.typography.fontBody,
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: theme.radii.md,
            background: theme.colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 16px",
          }}>
            🛡️
          </div>
          <div style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: 24, fontWeight: theme.typography.weightBlack,
            color: "white", marginBottom: 4,
          }}>
            TruGoa Admin
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Restricted access — authorized personnel only
          </div>
        </div>

        {/* card */}
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: theme.radii.xl,
          padding: 28,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* email */}
            <div>
              <label style={{ ...labelStyle, color: "rgba(255,255,255,0.7)" }}>
                Admin Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(null); }}
                placeholder="admin@trugoa.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.colors.primary}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* password */}
            <div>
              <label style={{ ...labelStyle, color: "rgba(255,255,255,0.7)" }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(null); }}
                placeholder="Enter admin password"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = theme.colors.primary}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* error */}
            {error && (
              <div style={{
                background: theme.colors.dangerBg,
                border: `1px solid ${theme.colors.danger}40`,
                borderRadius: theme.radii.md,
                padding: "10px 14px",
                fontSize: 13, color: theme.colors.danger,
              }}>
                {error}
              </div>
            )}

            {/* submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(255,255,255,0.1)" : theme.colors.primary,
                color: loading ? "rgba(255,255,255,0.4)" : theme.colors.textPrimary,
                border: "none", borderRadius: theme.radii.pill,
                padding: "14px", fontSize: 15,
                fontWeight: theme.typography.weightBold,
                fontFamily: theme.typography.fontBody,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
            >
              {loading ? "Logging in..." : "Access Dashboard →"}
            </button>
          </div>
        </div>

        <div style={{
          textAlign: "center", marginTop: 20,
          fontSize: 12, color: "rgba(255,255,255,0.2)",
        }}>
          🔒 This page is not publicly accessible
        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block", fontSize: 13,
  fontWeight: 600, marginBottom: 8,
};

const inputStyle = {
  width: "100%", padding: "12px 14px",
  borderRadius: "10px",
  border: "1.5px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  fontSize: 14, color: "white",
  outline: "none",
  fontFamily: "'Instrument Sans', sans-serif",
  transition: "border-color 0.15s ease",
  boxSizing: "border-box",
};

export default AdminLogin;