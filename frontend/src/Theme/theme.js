import { PALETTE } from "./palette";

const theme = {
  colors: {
    // Backgrounds
    bgPage:    PALETTE.neutral[50],
    bgSurface: PALETTE.neutral[100],
    bgCard:    PALETTE.neutral[0],
    bgDark:    PALETTE.neutral[800],

    // Brand
    primary:      PALETTE.yellow[400],
    primaryDark:  PALETTE.yellow[600],
    primaryLight: PALETTE.yellow[100],
    primaryText:  PALETTE.yellow[800],

    secondary:      PALETTE.green[600],
    secondaryDark:  PALETTE.green[800],
    secondaryLight: PALETTE.green[100],
    secondaryText:  PALETTE.green[800],

    accent:      PALETTE.coral[400],
    accentLight: PALETTE.coral[100],
    accentText:  PALETTE.coral[800],

    // Text
    textPrimary:   PALETTE.neutral[800],
    textBody:      PALETTE.neutral[500],
    textMuted:     PALETTE.neutral[400],
    textInverse:   PALETTE.neutral[0],

    // Borders
    borderLight:  PALETTE.neutral[200],
    borderMedium: PALETTE.neutral[300],

    // Semantic
    success:   PALETTE.success,
    successBg: PALETTE.successBg,
    warning:   PALETTE.warning,
    warningBg: PALETTE.warningBg,
    alert:     PALETTE.alert,
    alertBg:   PALETTE.alertBg,
    danger:    PALETTE.danger,
    dangerBg:  PALETTE.dangerBg,
  },

  typography: {
    fontDisplay: "Cormorant Garamond",
    fontBody:    "'Instrument Sans', sans-serif",

    sizeXs:  "11px",
    sizeSm:  "13px",
    sizeMd:  "15px",
    sizeLg:  "18px",
    sizeXl:  "24px",
    size2xl: "32px",
    size3xl: "48px",

    weightRegular: 400,
    weightMedium:  600,
    weightBold:    700,
    weightBlack:   800,

    lineHeightTight:  1.2,
    lineHeightNormal: 1.6,
    lineHeightRelaxed: 1.8,
  },

  spacing: {
    xs:  "4px",
    sm:  "8px",
    md:  "16px",
    lg:  "24px",
    xl:  "40px",
    xxl: "64px",
    pagePadding: "clamp(16px, 7vw, 96px)",
  },

  radii: {
    sm:   "8px",
    md:   "12px",
    lg:   "16px",
    xl:   "20px",
    pill: "50px",
    full: "9999px",
  },

  shadows: {
    card:   "0 2px 12px rgba(26,31,28,0.06)",
    cardHover: "0 12px 40px rgba(26,31,28,0.12)",
    modal:  "0 24px 60px rgba(26,31,28,0.18)",
  },

  transitions: {
    fast:   "all 0.15s ease",
    normal: "all 0.25s ease",
    spring: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  },
};

export default theme;