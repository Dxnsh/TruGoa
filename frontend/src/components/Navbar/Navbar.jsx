import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTourist } from "../../context/TouristContext";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import LoginModal from "../LoginModal/LoginModal";
import { Map, Bot, Route, Compass, Sun, ChevronDown, Search, Store, Heart } from "lucide-react";

const NAV_LINKS = [
  { label: "Explore",     path: "/explore",              icon: <Compass size={16} strokeWidth={2} /> },
  { label: "AI Guide",    path: "/goaguide",              icon: <Bot size={16} strokeWidth={2} /> },
  { label: "Itinerary",   path: "/itinerary",             icon: <Route size={16} strokeWidth={2} /> },
  { label: "Stories",     path: "/stories/destinations",  icon: <Map size={16} strokeWidth={2} /> },
];

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isTouristLoggedIn, tourist, touristLogout } = useTourist();
  const isMobile  = useIsMobile();
  const [showLoginModal,  setShowLoginModal ] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminLoggedIn = !!localStorage.getItem("trugoa_admin_token")

  // ── Auth-aware navigation ──────────────────────────────────
  
  const handleNavClick = (path) => {

      navigate(path);

  };

    useEffect(() => {
      const handler = (e) => {
        if (!e.target.closest("[data-profile-menu]")) {
          setShowProfileMenu(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);


  if (isAdminRoute && isAdminLoggedIn) return null;
  
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      height: 64,
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      padding: `0 ${isMobile ? "16px" : theme.spacing.pagePadding}`,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      fontFamily: theme.typography.fontBody,
    }}>

      {/* LOGO — cropped to the icon + wordmark, hiding the tagline/whitespace baked into the source image */}
      <div
        onClick={() => {
          if (location.pathname.startsWith("/admin")) {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
      }}
      style={{
        height: isMobile ? 38 : 48,
        width: isMobile ? 64 : 82,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <img
        src="/images/Trugoa_logo.png"
        alt="TruGoa"
        style={{
          height: isMobile ? 64 : 81,
          width: isMobile ? 64 : 81,
          marginTop: isMobile ? -8 : -10,
          display: "block",
        }}
      />
    </div>

      {/* RIGHT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 20 }}>

        {/* nav links — desktop only */}
        {!isMobile && NAV_LINKS.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <span
              key={link.path}
              onClick={() => handleNavClick(link.path)}  // ← changed
              style={{
                fontSize: 14,
                fontWeight: isActive ? theme.typography.weightMedium : theme.typography.weightRegular,
                color: isActive ? theme.colors.secondary : theme.colors.textBody,
                cursor: "pointer", paddingBottom: 2,
                borderBottom: isActive ? `2px solid ${theme.colors.secondary}` : "2px solid transparent",
                transition: theme.transitions.fast,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = theme.colors.secondary; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = theme.colors.textBody; }}
            >
              {link.label}
            </span>
          );
        })}

        {/* nav links — mobile: icon-only row */}
        {isMobile && NAV_LINKS.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <div
              key={link.path}
              onClick={() => handleNavClick(link.path)}
              aria-label={link.label}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: theme.radii.pill,
                cursor: "pointer",
                color: isActive ? theme.colors.secondary : theme.colors.textBody,
                background: isActive ? theme.colors.primaryLight : "transparent",
                transition: theme.transitions.fast,
              }}
            >
              {link.icon}
            </div>
          );
        })}


        {/* ── TOURIST SECTION ── */}
        {isTouristLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* avatar */}
            <div
              data-profile-menu
              onClick={() => setShowProfileMenu(prev => !prev)}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                border: `2px solid ${theme.colors.primary}`,
                cursor: "pointer", overflow: "hidden",
                background: theme.colors.primaryLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: theme.typography.fontDisplay,
                fontWeight: theme.typography.weightBold,
                color: theme.colors.primaryText,
                fontSize: 14, flexShrink: 0, position: "relative",
              }}
            >
              {tourist.avatar ? (
                <img
                  src={tourist.avatar}
                  alt={tourist.name}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                tourist.name?.[0]?.toUpperCase()
              )}
            </div>

            {!isMobile && (
              <span
                data-profile-menu
                style={{
                  fontSize: 13,
                  fontWeight: theme.typography.weightMedium,
                  color: theme.colors.textBody,
                }}
              >
                {tourist.name.split(" ")[0]}
              </span>
            )}

            {/* dropdown */}
            {showProfileMenu && (
              <div
                data-profile-menu
                style={{
                  position: "absolute",
                  top: 60, right: isMobile ? 16 : 80,
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radii.lg,
                  boxShadow: theme.shadows.modal,
                  minWidth: 200, zIndex: 300, overflow: "hidden",
                }}
              >
                {/* tourist info */}
                <div style={{
                  padding: "16px",
                  borderBottom: `1px solid ${theme.colors.borderLight}`,
                  background: theme.colors.bgSurface,
                }}>
                  <div style={{ fontSize: 14, fontWeight: theme.typography.weightBold, color: theme.colors.textPrimary, marginBottom: 2 }}>
                    {tourist.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                    {tourist.email}
                  </div>
                </div>

                {/* menu items */}
               {[
              {
                icon: <Map size={16} strokeWidth={2} />,
                label: "Explore Places",
                action: () => {
                  navigate("/explore");
                  setShowProfileMenu(false);
                },
              },
            {
              icon: <Bot size={16} strokeWidth={2} />,
              label: "Ask AI Guide",
              action: () => {
                navigate("/goaguide");
                setShowProfileMenu(false);
              },
            },
            {
              icon: <Route size={16} strokeWidth={2} />,
              label: "Itinerary",
              action: () => {
                navigate("/itinerary");
                setShowProfileMenu(false);
              },
            },
            {
              icon: <Heart size={16} strokeWidth={2} />,
              label: "Saved Places",
              action: () => {
                navigate("/saved");
                setShowProfileMenu(false);
              },
            },
          ].map((item) => (
                            <div
                              key={item.label}
                              onClick={item.action}
                              style={{
                                padding: "12px 16px",
                                display: "flex", alignItems: "center", gap: 10,
                                cursor: "pointer", fontSize: 14,
                                color: theme.colors.textBody,
                                transition: theme.transitions.fast,
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = theme.colors.bgSurface}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                ))}

                {/* sign out */}
                <div
                  onClick={() => { touristLogout(); setShowProfileMenu(false); }}
                  style={{
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", fontSize: 14,
                    color: theme.colors.danger,
                    borderTop: `1px solid ${theme.colors.borderLight}`,
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.dangerBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  
                  <span>Sign Out</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          !isTouristLoggedIn && (
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                background: "none",
                border: `1.5px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.pill,
                padding: isMobile ? "7px 12px" : "8px 18px",
                fontSize: 13, fontWeight: theme.typography.weightMedium,
                color: theme.colors.textBody,
                cursor: "pointer", fontFamily: theme.typography.fontBody,
                transition: theme.transitions.fast,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = theme.colors.borderMedium}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
            >
              Sign In
            </button>
          )
        )}

      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Sign in to explore Goa's best places"
        />
      )}
    </nav>
  );
};

export default Navbar;