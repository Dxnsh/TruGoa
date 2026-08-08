import { GoogleLogin } from "@react-oauth/google";
import { useTourist } from "../../context/TouristContext";
import { touristGoogleAuth } from "../../services/api";
import { theme } from "../../Theme";
import { useState } from "react";

const LoginModal = ({ onClose, onSuccess, message }) => {
  const { touristLogin } = useTourist();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // credentialResponse.credential is a Google-signed ID token — the backend
  // verifies it itself rather than trusting any identity fields from the client.
  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const { token, tourist } = await touristGoogleAuth(credentialResponse.credential);
      touristLogin(token, tourist);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: 20,
      }}
    >
      {/* modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: theme.colors.bgCard,
          borderRadius: theme.radii.xl,
          padding: "40px 32px",
          width: "100%", maxWidth: 420,
          marginBottom: "10vh",
          boxShadow: theme.shadows.modal,
          border: `1px solid ${theme.colors.borderLight}`,
          textAlign: "center",
          fontFamily: theme.typography.fontBody,
        }}
      >

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
          ✕
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

        {/* Google button — GoogleLogin renders its own button and yields a
            signed ID token ("credential") on success, which the backend verifies. */}
        <div style={{
          display: "flex", justifyContent: "center",
          marginBottom: 16, opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? "none" : "auto",
        }}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError("Google login failed. Please try again.")}
            text="continue_with"
            width="336"
          />
        </div>

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
    </div>
  );
};

export default LoginModal;
