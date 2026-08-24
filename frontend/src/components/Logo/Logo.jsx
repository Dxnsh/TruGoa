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
          {/* userSpaceOnUse, not the default bounding box, so one gradient runs
              continuously across four separate shapes instead of restarting
              inside each one. */}
          <linearGradient id={sun} gradientUnits="userSpaceOnUse" x1="28" y1="5" x2="28" y2="43">
            <stop offset="0%" stopColor={SUN_TOP} />
            <stop offset="55%" stopColor={SUN_MID} />
            <stop offset="100%" stopColor={SUN_LOW} />
          </linearGradient>
        </defs>

        {/* The dome, then the bands the horizon leaves behind. Drawn as real
            shapes rather than a circle with a mask cut out of it: Safari is
            unreliable about SVG masks, and when it declines one the entire
            mark disappears rather than degrading. Each band is as wide as the
            circle is at its own mid-height, so the stack tapers with the
            curve. Geometry from r=19 about (28,24). */}
        <g fill={`url(#${sun})`}>
          <path d="M9.43 28 A19 19 0 1 1 46.57 28 Z" />
          <rect x="10.86" y="30.4" width="34.28" height="3.6" rx="1.8" />
          <rect x="15.05" y="36.4" width="25.91" height="3.0" rx="1.5" />
          <rect x="21.92" y="41.0" width="12.17" height="2.0" rx="1.0" />
        </g>

        <rect x="4" y="47" width="48" height="4.6" rx="2.3" fill={INK} />
      </svg>

      {withWord && <span className="tg-logo-word">TRUGOA</span>}
    </span>
  );
};

export default Logo;
