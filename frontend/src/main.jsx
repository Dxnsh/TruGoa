import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { TouristProvider } from "./context/TouristContext";
import App from "./App";
import "./Theme/global.css";

// The boundary sits outside the providers, not just around <App />. A crash in
// a provider's own effect — which is exactly what a corrupt saved session
// caused — happens above <App />, so a boundary nested inside them would never
// see it. Outermost, nothing in the tree can blank the page unannounced.
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <TouristProvider>
            <App />
          </TouristProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </ErrorBoundary>
);