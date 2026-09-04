// "Is this place open right now?" — the single source of truth for open/closed
// state across the whole app (feed, deck, category pages, detail, trending).
//
// TruGoa is Goa-only, so every check is made against Asia/Kolkata (IST) rather
// than the server's local time or the visitor's device clock — a phone set to
// the wrong timezone must not change whether a Goan shack reads as open. IST is
// a fixed +05:30 with no daylight saving, but we still go through `Intl` with an
// explicit zone so this stays correct if that ever changes.
//
// The structured hours shape (see models/Business.js):
//   openingHours: {
//     monday: { periods: [{ open: "10:00", close: "14:00" },
//                          { open: "15:30", close: "19:30" }], closed: false },
//     ...
//     sunday: { closed: true },
//     is24Hours: false,
//   }
// Rules it has to handle:
//   - split hours in a day       → several periods (lunch + dinner service)
//   - a day the place is shut     → { closed: true }
//   - open 24 hours               → { is24Hours: true }
//   - a period crossing midnight  → close is numerically <= open
//                                   (a beach shack open 18:00–02:00)
//   - no hours entered yet        → openingHours undefined / empty
//                                   → status "unknown", never filtered out

const DAYS = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "HH:MM", 24-hour, minutes 00–59.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const MINUTES_IN_DAY = 24 * 60;

const toMinutes = (hhmm) => {
  if (typeof hhmm !== "string" || !TIME_RE.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const pad = (n) => String(n).padStart(2, "0");

const fromMinutes = (mins) => {
  const wrapped = ((mins % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

// Weekday index (0 = Sunday) and minutes-since-midnight, both in IST, derived
// from an absolute instant. `formatToParts` with a fixed `timeZone` is what
// keeps this independent of where the code runs.
export const istNow = (now = new Date()) => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );
  const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIndex = weekdayIndex[parts.weekday] ?? 0;
  // Some ICU builds emit "24" for midnight under hour12:false.
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return { dayIndex, minutesNow: hour * 60 + minute };
};

// A day's usable periods as { open, close, overnight } in minutes. `closed: true`
// wins over anything else on the object. Tolerates a legacy single { open, close }
// day as well as the { periods: [...] } shape.
const dayPeriods = (entry) => {
  if (!entry || entry.closed === true) return [];
  const raw = Array.isArray(entry.periods)
    ? entry.periods
    : (entry.open || entry.close ? [{ open: entry.open, close: entry.close }] : []);

  const out = [];
  for (const p of raw) {
    const open = toMinutes(p && p.open);
    const close = toMinutes(p && p.close);
    if (open === null || close === null || open === close) continue;
    out.push({ open, close, overnight: close < open });
  }
  return out;
};

const hasAnyHours = (openingHours) => {
  if (!openingHours || typeof openingHours !== "object") return false;
  if (openingHours.is24Hours === true) return true;
  return DAYS.some((d) => {
    const e = openingHours[d];
    return e && (e.closed === true || dayPeriods(e).length > 0);
  });
};

const UNKNOWN = {
  isOpen: false,
  status: "unknown",
  opensAt: null,
  closesAt: null,
  closesInMinutes: null,
  nextOpenTime: null,
};

const openResult = (closesInMinutes, closesAt) => ({
  isOpen: true,
  status: "open",
  opensAt: null,
  closesAt,
  closesInMinutes,
  nextOpenTime: null,
});

/**
 * @param {object|undefined} openingHours  structured hours, or undefined/empty
 * @param {Date} [now]                      absolute instant to check (default: real now)
 * @returns {{
 *   isOpen: boolean,
 *   status: "open" | "closed" | "unknown",
 *   opensAt: string | null,          // "HH:MM" IST — next opening, when closed
 *   closesAt: string | null,         // "HH:MM" IST — when currently open
 *   closesInMinutes: number | null,  // minutes until close, when currently open
 *   nextOpenTime: string | null,     // e.g. "Today 18:00" / "Mon 09:00", when closed
 * }}
 */
export function isPlaceOpenNow(openingHours, now = new Date()) {
  if (!hasAnyHours(openingHours)) return { ...UNKNOWN };

  const { dayIndex, minutesNow } = istNow(now);

  if (openingHours.is24Hours === true) {
    return {
      isOpen: true,
      status: "open",
      opensAt: null,
      closesAt: null,
      closesInMinutes: null,
      nextOpenTime: null,
    };
  }

  // 1. Any of today's periods containing now.
  for (const p of dayPeriods(openingHours[DAYS[dayIndex]])) {
    if (!p.overnight) {
      if (minutesNow >= p.open && minutesNow < p.close) {
        return openResult(p.close - minutesNow, fromMinutes(p.close));
      }
    } else if (minutesNow >= p.open) {
      // Opened today, closes after midnight tomorrow.
      return openResult(p.close + MINUTES_IN_DAY - minutesNow, fromMinutes(p.close));
    }
  }

  // 2. An overnight period from yesterday spilling past midnight into now.
  const yIndex = (dayIndex + 6) % 7;
  for (const p of dayPeriods(openingHours[DAYS[yIndex]])) {
    if (p.overnight && minutesNow < p.close) {
      return openResult(p.close - minutesNow, fromMinutes(p.close));
    }
  }

  // 3. Closed. Find the next period that opens, scanning up to a week out.
  for (let offset = 0; offset <= 7; offset++) {
    const idx = (dayIndex + offset) % 7;
    const periods = dayPeriods(openingHours[DAYS[idx]])
      .slice()
      .sort((a, b) => a.open - b.open);

    for (const p of periods) {
      // Today's opening only counts if it is still ahead of us.
      if (offset === 0 && p.open <= minutesNow) continue;

      const label =
        offset === 0 ? "Today" :
        offset === 1 ? "Tomorrow" :
        DAY_LABEL[idx];

      return {
        isOpen: false,
        status: "closed",
        opensAt: fromMinutes(p.open),
        closesAt: null,
        closesInMinutes: null,
        nextOpenTime: `${label} ${fromMinutes(p.open)}`,
      };
    }
  }

  // Every day is marked closed — shut indefinitely.
  return { ...UNKNOWN, status: "closed" };
}

// Attaches the derived open-state to a place object (or an array of them) under
// flat keys the frontend can read without re-deriving anything. Returned on
// every place in every response — filtered lists and single-place lookups alike
// — so future surfaces (map, search) get badges for free.
export const decorateOpenState = (place, now = new Date()) => {
  if (Array.isArray(place)) return place.map((p) => decorateOpenState(p, now));
  if (!place || typeof place !== "object") return place;
  const r = isPlaceOpenNow(place.openingHours, now);
  return {
    ...place,
    isOpenNow: r.isOpen,
    openStatus: r.status,
    opensAt: r.opensAt,
    closesAt: r.closesAt,
    closesInMinutes: r.closesInMinutes,
    nextOpenTime: r.nextOpenTime,
  };
};

// The one place that decides what the default feed shows: currently-open places
// and places whose hours we simply don't know yet. A place that is genuinely
// closed right now is the only thing dropped.
export const passesOpenNowFilter = (decorated) => decorated.openStatus !== "closed";
