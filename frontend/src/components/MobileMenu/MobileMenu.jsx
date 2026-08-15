import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Bot, Route, Map, Heart, X, LogOut, LogIn } from "lucide-react";
import { theme } from "../../Theme";
import { useTourist } from "../../context/TouristContext";

// Full-height text menu that replaces the cramped icon-only nav row on mobile.
// Icons stay as supporting marks, but every destination is a readable label in
// a single left-aligned column — icon-only navigation gives no clue what each
// target is until you tap it.
const MENU_LINKS = [
  { label: "Explore Places", path: "/explore",              icon: Compass },
  { label: "Ask AI Guide",   path: "/goaguide",             icon: Bot },
  { label: "Itinerary",      path: "/itinerary",            icon: Route },
  { label: "Stories",        path: "/stories/destinations", icon: Map },
  { label: "Saved Places",   path: "/saved",                icon: Heart },
];

const MobileMenu = ({ open, onClose, onRequestLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTouristLoggedIn, tourist, touristLogout } = useTourist();

  // A fixed overlay still lets the page behind it scroll on touch, which reads
  // as the menu drifting. Freeze the body while it's open and restore whatever
  // the page had set before, rather than assuming "".
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => { navigate(path); onClose(); };

  const rowBase = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    // 52px keeps every row above the 44px minimum touch target.
    minHeight: 52,
    padding: "14px 20px",
    background: "none",
    border: "none",
    textAlign: "left",
    fontFamily: theme.typography.fontBody,
    fontSize: 15,
    cursor: "pointer",
  };

  // Portalled to <body> on purpose. The Navbar renders this from inside its
  // own `position: sticky; z-index: 200` element, which creates a stacking
  // context — the scrim's z-index is then resolved *within* that context, so
  // page content could paint over it and swallow the tap-outside-to-close.
  // Escaping to the body root makes the z-indexes below mean what they say.
  return createPortal(
    <>
      {/* Scrim — tapping outside is the expected way to dismiss a sheet */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(12,22,16,0.5)",
          zIndex: 900,
        }}
      />

      <nav
        aria-label="Main menu"
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(82vw, 320px)",
          background: theme.colors.bgCard,
          zIndex: 901,
          display: "flex",
          flexDirection: "column",
          boxShadow: theme.shadows.modal,
          animation: "mm-slide .22s cubic-bezier(0.16,1,0.3,1)",
          overflowY: "auto",
        }}
      >
        <style>{`
          @keyframes mm-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) { nav[aria-label="Main menu"] { animation: none !important; } }
        `}</style>

        {/* Header — identity when signed in, brand when not */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 20px",
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            background: theme.colors.bgSurface,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {/* Same identity block the desktop profile menu shows, so the
                account reads the same on both. */}
            {isTouristLoggedIn && (
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                border: `2px solid ${theme.colors.primary}`,
                overflow: "hidden", flexShrink: 0,
                background: theme.colors.primaryLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: theme.typography.fontDisplay,
                fontWeight: theme.typography.weightBold,
                color: theme.colors.primaryText,
                fontSize: 18,
              }}>
                {tourist.avatar ? (
                  <img
                    src={tourist.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  tourist.name?.[0]?.toUpperCase()
                )}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
            {isTouristLoggedIn ? (
              <>
                <div style={{
                  fontSize: 15,
                  fontWeight: theme.typography.weightBold,
                  color: theme.colors.textPrimary,
                  marginBottom: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {tourist.name}
                </div>
                <div style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {tourist.email}
                </div>
              </>
            ) : (
              <div style={{
                fontFamily: theme.typography.fontDisplay,
                fontWeight: theme.typography.weightBlack,
                fontSize: 20,
                letterSpacing: "-0.5px",
              }}>
                <span style={{ color: theme.colors.secondary }}>Tru</span>
                <span style={{ color: theme.colors.primary }}>Goa</span>
              </div>
            )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              flexShrink: 0,
              width: 36, height: 36,
              borderRadius: "50%",
              border: "none",
              background: theme.colors.bgCard,
              color: theme.colors.textBody,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Destinations */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {MENU_LINKS.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => go(path)}
                aria-current={isActive ? "page" : undefined}
                style={{
                  ...rowBase,
                  color: isActive ? theme.colors.secondary : theme.colors.textBody,
                  fontWeight: isActive
                    ? theme.typography.weightMedium
                    : theme.typography.weightRegular,
                  background: isActive ? theme.colors.secondaryLight : "transparent",
                  // Colour alone shouldn't carry "you are here".
                  borderLeft: `3px solid ${isActive ? theme.colors.secondary : "transparent"}`,
                }}
              >
                <Icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Account action, kept separate from navigation */}
        <div style={{ borderTop: `1px solid ${theme.colors.borderLight}`, padding: "8px 0" }}>
          {isTouristLoggedIn ? (
            <button
              onClick={() => { touristLogout(); onClose(); }}
              style={{ ...rowBase, color: theme.colors.danger }}
            >
              <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onRequestLogin?.(); }}
              style={{ ...rowBase, color: theme.colors.secondary, fontWeight: theme.typography.weightMedium }}
            >
              <LogIn size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>
    </>,
    document.body
  );
};

export default MobileMenu;
