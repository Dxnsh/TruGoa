import { useGoogleLogin } from "@react-oauth/google";
import { useTourist } from "../../context/TouristContext";
import { touristGoogleAuth } from "../../services/api";
import { theme } from "../../Theme";
import { useState } from "react";

const LoginModal = ({ onClose, onSuccess, message }) => {
  const { touristLogin } = useTourist();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        // get user info from Google
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());

        // send to our backend
        const { token, tourist } = await touristGoogleAuth(userInfo.sub, userInfo.name, userInfo.email, userInfo.picture);
        touristLogin(token, tourist);
        onSuccess?.();
        onClose();
      } catch (err) {
        setError("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google login failed. Please try again."),
  });

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 900,
        }}
      />

      {/* modal */}
      <div style={{
        position: "fixed",
        top: "300px", left: "50%",
        height:"600%",
        transform: "translate(-50%, -50%)",
        zIndex: 901,
        background: theme.colors.bgCard,
        borderRadius: theme.radii.xl,
        padding: "40px 32px",
        width: "90%", maxWidth: 420,
        boxShadow: theme.shadows.modal,
        border: `1px solid ${theme.colors.borderLight}`,
        textAlign: "center",
        fontFamily: theme.typography.fontBody,
      }}>

        {/* close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            fontSize: 20, color: theme.colors.textMuted,
            cursor: "pointer", lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* logo */}
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28, fontWeight: 600, marginBottom: 8,
        }}>
          <span style={{ color: theme.colors.secondary }}>Tru</span>
          <span style={{ color: theme.colors.primary }}>Goa</span>
        </div>

        {/* message */}
        <h2 style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: 20, fontWeight: theme.typography.weightBlack,
          color: theme.colors.textPrimary,
          marginBottom: 8,
        }}>
          {message || "Sign in to continue"}
        </h2>
        <p style={{
          fontSize: 14, color: theme.colors.textMuted,
          lineHeight: 1.6, marginBottom: 28,
        }}>
          Join thousands of tourists who use TruGoa to explore Goa safely and smartly.
        </p>

        {/* Google button */}
        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 12,
            background: loading ? theme.colors.bgSurface : "white",
            border: `1.5px solid ${theme.colors.borderLight}`,
            borderRadius: theme.radii.lg,
            padding: "14px 24px",
            fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: theme.typography.fontBody,
            color: theme.colors.textPrimary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: theme.transitions.normal,
            marginBottom: 16,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <div style={{
            background: theme.colors.dangerBg,
            border: `1px solid ${theme.colors.danger}40`,
            borderRadius: theme.radii.md,
            padding: "10px 14px",
            fontSize: 13, color: theme.colors.danger,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <div style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.6 }}>
          By signing in you agree to our terms. We never post without your permission.
        </div>
      </div>
    </>
  );
};

export default LoginModal;