import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { TouristProvider } from "./context/TouristContext";
import App from "./App";
import "./Theme/global.css";

console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

createRoot(document.getElementById("root")).render(
    
  <GoogleOAuthProvider clientId="306365781183-04ft8ufsthmmripmtt5hjsfffikpp3l7.apps.googleusercontent.com">
    <AuthProvider>
      <TouristProvider>
        <App />
      </TouristProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);