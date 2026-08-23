import { useId } from "react";
import "./Logo.css";

/**
 * The TruGoa mark: a setting sun sliced by the horizon, over a solid bar.
 *
 * Drawn rather than loaded so it stays sharp at every size it's used at (a
 * 20px navbar and a 44px mobile header), costs no request, and needs no
 * separate 2x asset. The stripes are cut with a mask instead of being painted
 * over in the page colour, so the mark sits on a photo or a tinted panel
 * without carrying a background with it.
 *
 * If you'd rather ship the original artwork, drop it at public/logo.svg and
 * swap the <svg> below for <img src="/logo.svg" alt="" />; nothing else here
 * needs to change.
 *
 * Brand colours are deliberately literal rather than theme tokens: a logo
 * shouldn't restyle itself when the palette is adjusted.
 */
const SUN_TOP = "#FFC63C";
const SUN_MID = "#F9993A";
const SUN_LOW = "#F26B37";
const INK = "#12372A";

const Logo = ({ size = 28, withWord = true, className = "" }) => {
  // Two logos on one page (navbar + hero) would otherwise share gradient and
  // mask ids, and the second would inherit the first's definitions.
  const uid = useId().replace(/:/g, "");
  const sun = `tg-sun-${uid}`;
  const slice = `tg-slice-${uid}`;

  return (
    <span className={`tg-logo ${className}`.trim()}>
      <svg
        className="tg-logo-mark"
        viewBox="0 0 56 56"
        style={{ width: size, height: size }}
        role="img"
        aria-label={withWord ? "TruGoa" : "TruGoa home"}
      >
        <defs>
          <linearGradient id={sun} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SUN_TOP} />
            <stop offset="55%" stopColor={SUN_MID} />
            <stop offset="100%" stopColor={SUN_LOW} />
          </linearGradient>

          {/* White keeps, black cuts — so the gaps are genuinely transparent
              and the mark works on any background. */}
          <mask id={slice}>
            <rect width="56" height="56" fill="#fff" />
            <rect x="0" y="30.6" width="56" height="3.1" fill="#000" />
            <rect x="0" y="37.0" width="56" height="3.1" fill="#000" />
            <rect x="0" y="43.0" width="56" height="3.1" fill="#000" />
          </mask>
        </defs>

        <circle cx="28" cy="26" r="20" fill={`url(#${sun})`} mask={`url(#${slice})`} />
        <rect x="4" y="49" width="48" height="4.6" rx="2.3" fill={INK} />
      </svg>

      {withWord && <span className="tg-logo-word">TRUGOA</span>}
    </span>
  );
};

export default Logo;
