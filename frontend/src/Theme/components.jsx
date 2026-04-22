import theme from "./theme";

// ─── Buttons ───────────────────────────────────────────────

export const PrimaryButton = ({ children, onClick, style = {}, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? theme.colors.borderLight : theme.colors.primary,
      color: disabled ? theme.colors.textMuted : theme.colors.textPrimary,
      border: "none",
      borderRadius: theme.radii.pill,
      padding: "12px 28px",
      fontSize: theme.typography.sizeMd,
      fontWeight: theme.typography.weightBold,
      fontFamily: theme.typography.fontBody,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: theme.transitions.normal,
      ...style,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = theme.colors.primaryDark; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = theme.colors.primary; }}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: theme.colors.secondaryLight,
      color: theme.colors.secondary,
      border: `1.5px solid ${theme.colors.secondary}`,
      borderRadius: theme.radii.pill,
      padding: "12px 28px",
      fontSize: theme.typography.sizeMd,
      fontWeight: theme.typography.weightBold,
      fontFamily: theme.typography.fontBody,
      transition: theme.transitions.normal,
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.background = theme.colors.secondary; e.currentTarget.style.color = "white"; }}
    onMouseLeave={e => { e.currentTarget.style.background = theme.colors.secondaryLight; e.currentTarget.style.color = theme.colors.secondary; }}
  >
    {children}
  </button>
);

export const GhostButton = ({ children, onClick, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: theme.colors.bgSurface,
      color: theme.colors.textBody,
      border: `1.5px solid ${theme.colors.borderLight}`,
      borderRadius: theme.radii.pill,
      padding: "10px 22px",
      fontSize: theme.typography.sizeSm,
      fontWeight: theme.typography.weightMedium,
      fontFamily: theme.typography.fontBody,
      transition: theme.transitions.normal,
      ...style,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.borderMedium; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.borderLight; }}
  >
    {children}
  </button>
);

// ─── Badges ────────────────────────────────────────────────

export const Badge = ({ children, variant = "default", style = {} }) => {
  const variants = {
    default:  { bg: theme.colors.bgSurface,      color: theme.colors.textBody },
    verified: { bg: theme.colors.secondaryLight,  color: theme.colors.secondaryText },
    top:      { bg: theme.colors.primaryLight,    color: theme.colors.primaryText },
    new:      { bg: theme.colors.primary,         color: theme.colors.textPrimary },
    scam:     { bg: theme.colors.alertBg,         color: theme.colors.accentText },
    danger:   { bg: theme.colors.dangerBg,        color: theme.colors.danger },
  };
  const v = variants[variant] || variants.default;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 12px",
      borderRadius: theme.radii.pill,
      fontSize: theme.typography.sizeXs,
      fontWeight: theme.typography.weightBold,
      fontFamily: theme.typography.fontBody,
      letterSpacing: "0.3px",
      background: v.bg,
      color: v.color,
      ...style,
    }}>
      {children}
    </span>
  );
};

// ─── Cards ─────────────────────────────────────────────────

export const Card = ({ children, hoverable = false, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: theme.colors.bgCard,
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.borderLight}`,
      boxShadow: theme.shadows.card,
      padding: theme.spacing.lg,
      cursor: onClick ? "pointer" : "default",
      transition: hoverable ? theme.transitions.spring : "none",
      ...style,
    }}
    onMouseEnter={e => { if (hoverable) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = theme.shadows.cardHover; }}}
    onMouseLeave={e => { if (hoverable) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = theme.shadows.card; }}}
  >
    {children}
  </div>
);

export const SurfaceCard = ({ children, style = {} }) => (
  <div style={{
    background: theme.colors.bgSurface,
    borderRadius: theme.radii.lg,
    border: `1px solid ${theme.colors.borderLight}`,
    padding: theme.spacing.lg,
    ...style,
  }}>
    {children}
  </div>
);

// ─── Alert banners ─────────────────────────────────────────

export const Alert = ({ children, variant = "warning", style = {} }) => {
  const variants = {
    success: { bg: theme.colors.successBg, border: theme.colors.success,  color: theme.colors.secondaryText },
    warning: { bg: theme.colors.warningBg, border: theme.colors.warning,  color: theme.colors.primaryText },
    alert:   { bg: theme.colors.alertBg,   border: theme.colors.alert,    color: theme.colors.accentText },
    danger:  { bg: theme.colors.dangerBg,  border: theme.colors.danger,   color: theme.colors.danger },
  };
  const v = variants[variant] || variants.warning;

  return (
    <div style={{
      background: v.bg,
      borderLeft: `4px solid ${v.border}`,
      borderRadius: theme.radii.sm,
      padding: "12px 16px",
      fontSize: theme.typography.sizeSm,
      color: v.color,
      lineHeight: 1.6,
      ...style,
    }}>
      {children}
    </div>
  );
};

// ─── Section heading ───────────────────────────────────────

export const SectionHeading = ({ title, subtitle, style = {} }) => (
  <div style={{ marginBottom: theme.spacing.lg, ...style }}>
    <h2 style={{
      fontFamily: theme.typography.fontDisplay,
      fontSize: "clamp(22px, 3vw, 34px)",
      fontWeight: theme.typography.weightBlack,
      color: theme.colors.textPrimary,
      letterSpacing: "-0.8px",
      marginBottom: 6,
    }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{
        fontSize: theme.typography.sizeMd,
        color: theme.colors.textMuted,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Input ─────────────────────────────────────────────────

export const Input = ({ placeholder, value, onChange, icon, style = {} }) => (
  <div style={{ position: "relative", ...style }}>
    {icon && (
      <span style={{
        position: "absolute", left: 14, top: "50%",
        transform: "translateY(-50%)", fontSize: 16,
        pointerEvents: "none",
      }}>
        {icon}
      </span>
    )}
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        paddingLeft: icon ? 40 : 14,
      }}
    />
  </div>
);

// ─── Loading spinner ───────────────────────────────────────

export const LoadingState = ({ message = "Loading..." }) => (
  <div style={{ textAlign: "center", padding: "80px 0" }}>
    <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
    <div style={{
      fontFamily: theme.typography.fontDisplay,
      fontSize: theme.typography.sizeLg,
      fontWeight: theme.typography.weightBold,
      color: theme.colors.secondary,
      marginBottom: 8,
    }}>
      {message}
    </div>
  </div>
);

// ─── Empty state ───────────────────────────────────────────

export const EmptyState = ({ icon = "🔍", title, subtitle, action }) => (
  <div style={{ textAlign: "center", padding: "60px 0" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{
      fontFamily: theme.typography.fontDisplay,
      fontSize: theme.typography.sizeXl,
      fontWeight: theme.typography.weightBold,
      color: theme.colors.textPrimary,
      marginBottom: 8,
    }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: theme.typography.sizeMd, color: theme.colors.textMuted, marginBottom: 24 }}>
        {subtitle}
      </div>
    )}
    {action}
  </div>
);