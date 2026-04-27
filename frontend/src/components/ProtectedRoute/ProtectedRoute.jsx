// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { TouristContext } from "../../context/TouristContext";

export default function ProtectedRoute({ children }) {
  const { tourist, touristLoading } = useContext(TouristContext);

  // Still checking localStorage — don't flash redirect
  if (touristLoading) return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#F7F3EC",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid rgba(45,106,79,0.15)",
        borderTopColor: "#2D6A4F",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Not logged in — send to homepage where login modal lives
  if (!tourist) return <Navigate to="/" replace />;

  return children;
}