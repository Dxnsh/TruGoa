import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../Logo/Logo";
import "./aiGuideFab.css";

// Pages where the launcher would be redundant or in the way — the chat page
// itself, and the admin area, which has its own chrome.
const HIDDEN_ON = ["/goaguide"];

// Floating GoaGuide launcher, rendered once at the app root so it follows
// the visitor across every route instead of only appearing on the homepage.
const AIGuideFab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hidden =
    HIDDEN_ON.includes(location.pathname) || location.pathname.startsWith("/admin");
  if (hidden) return null;

  return (
    <button
      className="fab-ai"
      onClick={() => navigate("/goaguide")}
      aria-label="Ask GoaGuide AI"
    >
      <span className="fab-ai-mark">
        <Logo size={24} withWord={false} />
      </span>
      <span className="fab-ai-label">Ask GoaGuide AI</span>
    </button>
  );
};

export default AIGuideFab;
