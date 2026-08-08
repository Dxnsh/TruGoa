import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerOwner, loginOwner } from "../../services/api";
import SEO from "../../components/SEO/SEO";
import { theme } from "../../Theme";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name:     "",
    email:    "",
    password: "",
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let result;
      if (mode === "register") {
        result = await registerOwner(form);
      } else {
        result = await loginOwner({ email: form.email, password: form.password });
      }
     login(result.token, result.owner);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.colors.bgPage,
      fontFamily: theme.typography.fontBody,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: `${theme.spacing.lg} ${theme.spacing.pagePadding}`,
    }}>
      <SEO path="/auth" title="Sign In" noindex />
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            textAlign: "center",
            marginBottom: 32,
            cursor: "pointer",
          }}
        >
          <div style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: 32,
            fontWeight: theme.typography.weightBlack,
            letterSpacing: "-1px",
          }}>
            <span style={{ color: theme.colors.secondary }}>Tru</span>
            <span style={{ color: theme.colors.primary }}>Goa</span>
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
            Business Owner Portal
          </div>
        </div>

        {/* card */}
        <div style={{
          background: theme.colors.bgCard,
          borderRadius: theme.radii.xl,
          boxShadow: theme.shadows.modal,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>

          {/* tab switcher */}
          <div style={{
            display: "flex",
            borderBottom: `1px solid ${theme.colors.borderLight}`,
          }}>
            {[
              { id: "login",    label: "Log In" },
              { id: "register", label: "Create Account" },
            ].map(tab => {
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError(null); }}
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: isActive ? theme.colors.bgCard : theme.colors.bgSurface,
                    border: "none",
                    borderBottom: isActive
                      ? `2px solid ${theme.colors.primary}`
                      : "2px solid transparent",
                    fontFamily: theme.typography.fontBody,
                    fontSize: 14,
                    fontWeight: isActive
                      ? theme.typography.weightBold
                      : theme.typography.weightRegular,
                    color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                    cursor: "pointer",
                    transition: theme.transitions.fast,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* form body */}
          <div style={{ padding: 28 }}>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontFamily: theme.typography.fontDisplay,
                fontSize: 22,
                fontWeight: theme.typography.weightBlack,
                color: theme.colors.textPrimary,
                marginBottom: 6,
              }}>
                {mode === "login" ? "Welcome back 👋" : "Join TruGoa 🌴"}
              </h2>
              <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
                {mode === "login"
                  ? "Log in to your business owner account."
                  : "Create a business owner account. Listing management is coming soon — for now, places are added by the TruGoa team."}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* name — only on register */}
              {mode === "register" && (
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = theme.colors.primary}
                    onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
                  />
                </div>
              )}

              {/* email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = theme.colors.primary}
                  onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
                />
              </div>

              {/* password */}
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = theme.colors.primary}
                  onBlur={e => e.target.style.borderColor = theme.colors.borderLight}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {/* error message */}
              {error && (
                <div style={{
                  background: theme.colors.dangerBg,
                  border: `1px solid ${theme.colors.danger}40`,
                  borderRadius: theme.radii.md,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: theme.colors.danger,
                }}>
                  {error}
                </div>
              )}

              {/* submit button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  background: submitting ? theme.colors.borderLight : theme.colors.primary,
                  color: submitting ? theme.colors.textMuted : theme.colors.textPrimary,
                  border: "none",
                  borderRadius: theme.radii.pill,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: theme.typography.weightBold,
                  fontFamily: theme.typography.fontBody,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: theme.transitions.normal,
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = theme.colors.primaryDark; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = theme.colors.primary; }}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "login" ? "Log In →" : "Create Account →"}
              </button>

            </div>
          </div>

          {/* footer */}
          <div style={{
            padding: "16px 28px",
            background: theme.colors.bgSurface,
            borderTop: `1px solid ${theme.colors.borderLight}`,
            textAlign: "center",
            fontSize: 13,
            color: theme.colors.textMuted,
          }}>
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <span
                  onClick={() => setMode("register")}
                  style={{ color: theme.colors.secondary, cursor: "pointer", fontWeight: theme.typography.weightMedium }}
                >
                  Create one
                </span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span
                  onClick={() => setMode("login")}
                  style={{ color: theme.colors.secondary, cursor: "pointer", fontWeight: theme.typography.weightMedium }}
                >
                  Log in
                </span>
              </>
            )}
          </div>
        </div>

        {/* bottom note */}
        <div style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 12,
          color: theme.colors.textMuted,
          lineHeight: 1.6,
        }}>
          🔒 Your data is secure. We never share your information.
        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#1A1F1C",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1.5px solid #E5E0D8",
  background: "#FAFAF7",
  fontSize: 14,
  color: "#1A1F1C",
  outline: "none",
  fontFamily: "'Instrument Sans', sans-serif",
  transition: "border-color 0.15s ease",
  boxSizing: "border-box",
};

export default AuthPage;