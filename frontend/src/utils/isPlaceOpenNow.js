// Client-side twin of backend/utils/isPlaceOpenNow.js.
//
// The API already returns `isOpenNow` / `openStatus` / `nextOpenTime` on every
// place, computed in IST — that's the authoritative value and what a fresh page
// load shows. This copy exists for one job: re-deriving the badge for a tab
// that's been left open for hours, without a refetch. Same rules, same fixed
// Asia/Kolkata timezone, so it can't disagree with the server beyond the drift
// of the wall clock itself.

const DAYS = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];
const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTES_IN_DAY = 1440;

const toMinutes = (hhmm) => {
  if (typeof hhmm !== "string" || !TIME_RE.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const pad = (n) => String(n).padStart(2, "0");
const fromMinutes = (mins) => {
  const w = ((mins % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${pad(Math.floor(w / 60))}:${pad(w % 60)}`;
};

const istNow = (now) => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    dayIndex: weekdayIndex[parts.weekday] ?? 0,
    minutesNow: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
};

// A day's usable periods as { open, close, overnight } in minutes. Tolerates a
// legacy single { open, close } day as well as the { periods: [...] } shape.
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

const hasAnyHours = (h) => {
  if (!h || typeof h !== "object") return false;
  if (h.is24Hours === true) return true;
  return DAYS.some((d) => h[d] && (h[d].closed === true || dayPeriods(h[d]).length > 0));
};

const UNKNOWN = {
  isOpen: false, status: "unknown",
  opensAt: null, closesAt: null, closesInMinutes: null, nextOpenTime: null,
};

export function isPlaceOpenNow(openingHours, now = new Date()) {
  if (!hasAnyHours(openingHours)) return { ...UNKNOWN };
  const { dayIndex, minutesNow } = istNow(now);

  if (openingHours.is24Hours === true) {
    return { isOpen: true, status: "open", opensAt: null, closesAt: null, closesInMinutes: null, nextOpenTime: null };
  }

  const open = (untilClose, closesAt) => ({
    isOpen: true, status: "open", opensAt: null, closesAt, closesInMinutes: untilClose, nextOpenTime: null,
  });

  for (const p of dayPeriods(openingHours[DAYS[dayIndex]])) {
    if (!p.overnight) {
      if (minutesNow >= p.open && minutesNow < p.close) {
        return open(p.close - minutesNow, fromMinutes(p.close));
      }
    } else if (minutesNow >= p.open) {
      return open(p.close + MINUTES_IN_DAY - minutesNow, fromMinutes(p.close));
    }
  }

  for (const p of dayPeriods(openingHours[DAYS[(dayIndex + 6) % 7]])) {
    if (p.overnight && minutesNow < p.close) {
      return open(p.close - minutesNow, fromMinutes(p.close));
    }
  }

  for (let offset = 0; offset <= 7; offset++) {
    const idx = (dayIndex + offset) % 7;
    const periods = dayPeriods(openingHours[DAYS[idx]]).slice().sort((a, b) => a.open - b.open);
    for (const p of periods) {
      if (offset === 0 && p.open <= minutesNow) continue;
      const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : DAY_LABEL[idx];
      return {
        isOpen: false, status: "closed",
        opensAt: fromMinutes(p.open), closesAt: null, closesInMinutes: null,
        nextOpenTime: `${label} ${fromMinutes(p.open)}`,
      };
    }
  }
  return { ...UNKNOWN, status: "closed" };
}

// "18:00" → "6:00 PM". Kept here so the badge and the hours table read alike.
export const to12Hour = (hhmm) => {
  const mins = toMinutes(hhmm);
  if (mins === null) return hhmm;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${pad(m)} ${period}`;
};

// The short line a badge shows. Accepts either a raw result from isPlaceOpenNow
// or the flattened fields the API returns on a place (openStatus/closesAt/…).
export const openLabel = (input) => {
  const status = input.status ?? input.openStatus;
  const closesInMinutes = input.closesInMinutes;
  const closesAt = input.closesAt;
  const nextOpenTime = input.nextOpenTime;

  if (status === "open") {
    if (typeof closesInMinutes === "number" && closesInMinutes <= 30) {
      return `Closes ${to12Hour(closesAt)}`;
    }
    return "Open now";
  }
  if (status === "closed") {
    if (nextOpenTime) {
      const [day, hhmm] = String(nextOpenTime).split(" ");
      const when = day === "Today" ? "" : `${day === "Tomorrow" ? "tomorrow" : day} `;
      return `Opens ${when}${to12Hour(hhmm)}`.trim();
    }
    return "Closed";
  }
  return null; // unknown — no badge
};

// "open" | "closing-soon" | "closed" | null — drives the badge's colour.
export const openTone = (input) => {
  const status = input.status ?? input.openStatus;
  if (status === "open") {
    return typeof input.closesInMinutes === "number" && input.closesInMinutes <= 30
      ? "closing-soon"
      : "open";
  }
  if (status === "closed") return "closed";
  return null;
};
