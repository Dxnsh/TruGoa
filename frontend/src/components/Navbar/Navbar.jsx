import { useState,useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTourist } from "../../context/TouristContext";
import { theme } from "../../Theme";
import useIsMobile from "../../hooks/useIsMobile";
import LoginModal from "../LoginModal/LoginModal";
import { Map,Bot, House,Route } from "lucide-react";


const NAV_LINKS = [
  { label: "Home",     path: "/" },
  { label: "Explore",  path: "/listings" },
  { label: "AI Guide", path: "/goaguide" },
  { label: "Itinerary", path: "/itinerary" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, owner, logout } = useAuth();
  const { isTouristLoggedIn, tourist, touristLogout } = useTourist(); // ✅ inside component
  const isMobile = useIsMobile();
  const [showLoginModal, setShowLoginModal] = useState(false); // ✅ inside component
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
  const handler = (e) => {
    if (!e.target.closest("[data-profile-menu]")) {
      setShowProfileMenu(false);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      height: 64,
      background: "rgba(250,250,247,0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      padding: `0 ${isMobile ? "16px" : theme.spacing.pagePadding}`,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      fontFamily: theme.typography.fontBody,
    }}>

      {/* LOGO */}
      <div
        onClick={() => navigate("/")}
        style={{
          fontFamily: theme.typography.fontDisplay,
          fontWeight: theme.typography.weightBlack,
          fontSize: isMobile ? 20 : 22,
          cursor: "pointer", letterSpacing: "-0.5px",
        }}
      >
        <span style={{ color: theme.colors.secondary }}>Tru</span>
        <span style={{ color: theme.colors.primary }}>Goa</span>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 20 }}>

        {/* nav links — desktop only */}
        {!isMobile && NAV_LINKS.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <span
              key={link.path}
              onClick={() => navigate(link.path)}
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

        {/* icon links — mobile only */}
        {isMobile && (
            <div style={{ display: "flex", gap: 4 }}>
    {[
      { icon: <House size={24} />, path: "/" },
      { icon: <Map size={24} />, path: "/listings" },
      { icon: <Bot size={24} />, path: "/goaguide" },
      { icon: <Route size={24} />, path: "/itinerary" },
    ].map((link) => {
      const isActive = location.pathname === link.path;

      return (
        <button
          key={link.path}
          onClick={() => navigate(link.path)}
          style={{
            background: isActive ? theme.colors.primaryLight : "transparent",
            border: "none",
            borderRadius: theme.radii.md,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isActive ? theme.colors.primary : theme.colors.textMuted,
            transition: "all 0.2s ease",
          }}
        >
          {link.icon}
        </button>
      );
    })}
            </div>
        )}

        {/* ── TOURIST SECTION ── */}
       {isTouristLoggedIn ? (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

    {/* avatar with fallback initial */}
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
        fontSize: 14, flexShrink: 0,
        position: "relative",
      }}
    >
      {tourist.avatar ? (
        <img
          src={tourist.avatar}
          alt={tourist.name}
          referrerPolicy="no-referrer"   // ✅ fixes Google avatar blocked issue
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { e.target.style.display = "none"; }} // ✅ hide if fails
        />
      ) : (
        tourist.name?.[0]?.toUpperCase() // ✅ fallback initial
      )}
    </div>

    {!isMobile && (
      <span 
      data-profile-menu
      style={{
        fontSize: 13,
        fontWeight: theme.typography.weightMedium,
        color: theme.colors.textBody,
      }}>
        {tourist.name.split(" ")[0]}
      </span>
    )}

    {/* dropdown menu */}
    {showProfileMenu && (
      <div data-profile-menu
       style={{  
        position: "absolute",
        top: 60, right: isMobile ? 16 : 80,
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: theme.radii.lg,
        boxShadow: theme.shadows.modal,
        minWidth: 200, zIndex: 300,
        overflow: "hidden",
      }}>
        {/* tourist info */}
        <div style={{
          padding: "16px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          background: theme.colors.bgSurface,
        }}>
          <div style={{
            fontSize: 14, fontWeight: theme.typography.weightBold,
            color: theme.colors.textPrimary, marginBottom: 2,
          }}>
            {tourist.name}
          </div>
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {tourist.email}
          </div>
        </div>

        {/* menu items */}
        {[
          { icon: "🗺️", label: "Explore Places",  action: () => { navigate("/listings"); setShowProfileMenu(false); } },
          { icon: "🤖", label: "Ask AI Guide",     action: () => { navigate("/goaguide"); setShowProfileMenu(false); } },
          { icon: "🤖", label: "itinerary",     action: () => { navigate("/itinerary"); setShowProfileMenu(false); } },
        ].map(item => (
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
          onClick={() => { touristLogout();
             setShowProfileMenu(false); }}
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
          <span>↩</span>
          <span>Sign Out</span>
        </div>
      </div>
    )}
  </div>
) : (
  !isLoggedIn && (
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
      {isMobile ? "Sign In" : "Tourist Sign In"}
    </button>
  )
)}

        {/* ── OWNER SECTION ── */}
        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isMobile && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: theme.colors.secondaryLight,
                border: `1px solid ${theme.colors.secondary}30`,
                borderRadius: theme.radii.pill,
                padding: "6px 14px",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: theme.colors.secondary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: theme.typography.weightBold, color: "white",
                }}>
                  {owner?.name?.[0]?.toUpperCase()}
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: theme.typography.weightMedium,
                  color: theme.colors.secondaryText,
                }}>
                  {owner?.name}
                </span>
              </div>
            )}
            <button
              onClick={() => navigate("/add-business")}
              style={{
                background: theme.colors.primary,
                color: theme.colors.textPrimary,
                border: "none", borderRadius: theme.radii.pill,
                padding: isMobile ? "8px 14px" : "9px 18px",
                fontSize: isMobile ? 12 : 13,
                fontWeight: theme.typography.weightBold,
                fontFamily: theme.typography.fontBody, cursor: "pointer",
              }}
            >
              {isMobile ? "+ List" : "+ Add Listing"}
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              style={{
                background: "none",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radii.pill,
                padding: isMobile ? "7px 10px" : "8px 16px",
                fontSize: 12, color: theme.colors.textMuted,
                fontFamily: theme.typography.fontBody, cursor: "pointer",
              }}
            >
              {isMobile ? "↩" : "Log Out"}
            </button>
          </div>
        ) : (
          // only show "List Your Business" if tourist is NOT logged in either
          !isTouristLoggedIn && (
            <button
              onClick={() => navigate("/auth")}
              style={{
                background: theme.colors.primary,
                color: theme.colors.textPrimary,
                border: "none", borderRadius: theme.radii.pill,
                padding: isMobile ? "8px 14px" : "9px 22px",
                fontSize: isMobile ? 12 : 13,
                fontWeight: theme.typography.weightBold,
                fontFamily: theme.typography.fontBody, cursor: "pointer",
              }}
            >
              {isMobile ? "List Biz" : "List Your Business"}
            </button>
          )
        )}
      </div>

      {/* login modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          message="Sign in to book and review"
        />
      )}
    </nav>
  );
};

export default Navbar;