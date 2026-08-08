import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { TouristProvider } from "./context/TouristContext";
import App from "./App";
import "./Theme/global.css";

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <TouristProvider>
          <App />
        </TouristProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </HelmetProvider>
);