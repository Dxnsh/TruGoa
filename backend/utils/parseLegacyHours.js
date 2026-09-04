// Backend port of frontend/src/pages/Admin/parseHoursText.js — the exact parser
// behind the admin "Paste hours" box. Used by the migration that converts the
// legacy free-text `openingHours` strings into structured per-day hours, so the
// conversion is identical to an admin pasting each string and hitting
// "Parse & fill". Kept as its own file (not imported cross-package) — if the
// frontend parser changes, this stays a snapshot of the version the migration
// ran against.
//
// parseHoursText(str) -> { hours, warnings }
//   hours    - { monday: { closed, periods: [{open,close}] }, ..., is24Hours }
//   warnings - lines it couldn't place

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_ALIASES = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};
const DAY_TOKEN = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat|sun)";
const DAY_RE = new RegExp(DAY_TOKEN, "gi");

export const blankOpeningHours = () => ({
  monday:    { closed: false, periods: [{ open: "", close: "" }] },
  tuesday:   { closed: false, periods: [{ open: "", close: "" }] },
  wednesday: { closed: false, periods: [{ open: "", close: "" }] },
  thursday:  { closed: false, periods: [{ open: "", close: "" }] },
  friday:    { closed: false, periods: [{ open: "", close: "" }] },
  saturday:  { closed: false, periods: [{ open: "", close: "" }] },
  sunday:    { closed: false, periods: [{ open: "", close: "" }] },
  is24Hours: false,
});

const DASHES = /[‐-―−]/g;
const normalise = (raw) =>
  String(raw || "")
    .replace(DASHES, "-")
    .replace(/[·•|]+/g, ";")   // bullet / pipe separators between day-blocks
    .replace(/:\s+/g, " ")     // "Tuesday–Sunday: 11 AM" — the colon is just a gap
    .replace(/[^\S\n]*\n[^\S\n]*/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();

const timeToMinutes = (token, pmHint) => {
  const t = String(token).trim().toLowerCase();
  if (/^(12\s*)?noon$/.test(t)) return 12 * 60;
  if (/^(12\s*)?midnight$/.test(t)) return 0;

  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*\.?\s*$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const mk = m[3] ? m[3][0] : (pmHint || null);

  if (h === 12 && mk === "a") h = 0;
  else if (h === 12 && mk === "p") h = 12;
  else if (mk === "p") h += 12;

  if (min > 59 || h > 24) return null;
  if (h === 24) h = 0;
  return h * 60 + min;
};

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

const markerOf = (s) => {
  const t = String(s).toLowerCase();
  if (/pm|p\.?\s?m\b|\dp\b|\bp$|noon/.test(t)) return "p";
  if (/am|a\.?\s?m\b|\da\b|\ba$|midnight/.test(t)) return "a";
  return null;
};

const parseRange = (chunk) => {
  const parts = chunk.split(/\s*(?:-|to|until|till|thru)\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length !== 2) return null;

  const lm = markerOf(parts[0]);
  const rm = markerOf(parts[1]);

  let close = timeToMinutes(parts[1], rm);
  let open;

  if (lm) {
    open = timeToMinutes(parts[0]);
  } else if (rm) {
    const same = timeToMinutes(parts[0], rm);
    const flip = timeToMinutes(parts[0], rm === "p" ? "a" : "p");
    open = (same !== null && close !== null && same < close) ? same : flip;
  } else {
    open = timeToMinutes(parts[0]);
    close = timeToMinutes(parts[1]);
    if (open !== null && close !== null && close <= open && close < 12 * 60) close += 12 * 60;
  }

  if (open === null || close === null || open === close) return null;
  // `guessed` = neither end carried an am/pm marker, so the times might need a
  // 12-hour bump against a preceding period (see parsePeriods).
  return { open, close, guessed: !lm && !rm };
};

const parsePeriods = (spec, warn) => {
  // Split on explicit separators, and also where a period's trailing "pm"/"am"
  // butts straight against the next period's digits ("11 am-4 pm 6-11 pm").
  const chunks = spec
    .replace(/(am|pm|a\.?m\.?|p\.?m\.?|noon|midnight)\s+(?=\d)/gi, "$1 & ")
    .split(/\s*(?:&|,|\+|\/|;| and )\s*/i);

  const out = [];
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    const r = parseRange(trimmed);
    if (r) out.push(r);
    // A chunk that clearly meant to be a time range but didn't parse — flag it
    // rather than silently dropping a window.
    else if (warn && /\d/.test(trimmed) && /-|(?:^|\s)(?:to|thru|till|until)(?:\s|$)/i.test(trimmed)) {
      warn(`Couldn't read a time range in: "${trimmed}"`);
    }
  }

  // A later un-marked period that opens before an earlier period closed is
  // almost always an afternoon window read as morning ("10-2 & 3:30-7:30" →
  // the second is 15:30-19:30). Bump it by 12h.
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1];
    const cur = out[i];
    if (cur.guessed && cur.open < prev.close && cur.open + 12 * 60 < 24 * 60) {
      cur.open += 12 * 60;
      if (cur.close < cur.open) cur.close += 12 * 60;
    }
  }

  return out.map((p) => ({ open: hhmm(p.open % (24 * 60)), close: hhmm(p.close % (24 * 60)) }));
};

const RANGE_RE = new RegExp(`(${DAY_TOKEN})\\s*(?:-|to|thru|through)\\s*(${DAY_TOKEN})`, "gi");

const parseDays = (fragment) => {
  const f = fragment.toLowerCase();
  if (/\b(daily|every\s?day|all\s?week|7\s?days|everyday)\b/.test(f)) return [0, 1, 2, 3, 4, 5, 6];
  if (/\bweekdays?\b/.test(f)) return [1, 2, 3, 4, 5];
  if (/\bweekends?\b/.test(f)) return [0, 6];

  const set = new Set();
  // Day ranges first — there can be several ("Mon, Wed–Sun").
  RANGE_RE.lastIndex = 0;
  let m;
  while ((m = RANGE_RE.exec(f))) {
    const a = DAY_ALIASES[m[1]];
    const b = DAY_ALIASES[m[2]];
    if (a == null || b == null) continue;
    for (let i = a, guard = 0; guard < 8; i = (i + 1) % 7, guard++) {
      set.add(i);
      if (i === b) break;
    }
  }
  // Then any standalone day names left once the ranges are blanked out.
  for (const mm of f.replace(RANGE_RE, " ").matchAll(DAY_RE)) {
    const d = DAY_ALIASES[mm[0].toLowerCase()];
    if (d != null) set.add(d);
  }
  return [...set];
};

const parseSpec = (fragment, warn) => {
  const t = fragment.toLowerCase();
  if (/\b(24\s?\/?\s?7|24\s?(hours?|hrs?)|round the clock|all day|always open)\b/.test(t)) {
    return { all: true };
  }
  if (/\b(closed|shut|by appointment)\b/.test(t) && !/\d/.test(t)) return { closed: true };
  const periods = parsePeriods(fragment, warn);
  return periods.length ? { periods } : null;
};

const DAY_EXPR_RE = new RegExp(
  `${DAY_TOKEN}(?:\\s*(?:-|to|thru|through|,|and|&|/)\\s*${DAY_TOKEN})*`,
  "gi"
);

const stripDayWords = (fragment) =>
  fragment
    .replace(DAY_EXPR_RE, " ")
    .replace(/\b(daily|every\s?day|everyday|all\s?week|weekdays?|weekends?|7\s?days|open|hours?|hrs?|a day)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const applySpec = (hours, dayIdxs, spec) => {
  for (const d of dayIdxs) {
    const key = DAY_KEYS[d];
    if (spec.closed) hours[key] = { closed: true, periods: [{ open: "", close: "" }] };
    else if (spec.all) hours[key] = { closed: false, periods: [{ open: "00:00", close: "23:59" }] };
    else hours[key] = { closed: false, periods: spec.periods.map((p) => ({ ...p })) };
  }
};

const appendPeriods = (hours, dayIdxs, periods) => {
  for (const d of dayIdxs) {
    const key = DAY_KEYS[d];
    const cur = hours[key];
    const base = cur && !cur.closed && Array.isArray(cur.periods)
      ? cur.periods.filter((p) => p.open && p.close)
      : [];
    hours[key] = { closed: false, periods: [...base, ...periods.map((p) => ({ ...p }))] };
  }
};

export function parseHoursText(raw) {
  const text = normalise(raw);
  const warnings = [];
  const hours = blankOpeningHours();
  const touched = new Set();

  if (!text) return { hours, warnings: ["Nothing to parse."] };

  if (/^(open\s+)?(24\s?\/?\s?7|24\s?(hours?|hrs?)|open 24|always open)([, ]*(a day|daily|every ?day|everyday|all week|7 days))?\.?$/i.test(text)) {
    return { hours: { ...hours, is24Hours: true }, warnings };
  }

  const exceptions = [];
  const bodyText = text.replace(/\(([^)]*)\)/g, (_, inner) => { exceptions.push(inner); return " "; });

  const segments = bodyText.includes("\n")
    ? bodyText.split(/\n+/)
    : bodyText.split(/\s*[;,]\s*/);

  let pendingSpec = null;
  let pendingDays = null;
  let lastDays = null;

  for (const seg of segments) {
    const frag = seg.trim();
    if (!frag) continue;

    const days = parseDays(frag);
    const spec = parseSpec(stripDayWords(frag), (w) => warnings.push(w));

    // "<day> closed" is an exclusion carved out of the surrounding hours
    // ("10-6:30; closed Mondays"), so it marks those days shut without
    // discarding a pending daily spec that still has to land on the rest.
    if (days.length && spec && spec.closed) {
      applySpec(hours, days, { closed: true });
      days.forEach((d) => touched.add(d));
      continue;
    }

    if (days.length && spec) {
      // "Mon, Wed–Sun: 8:30–1" — a bare day segment ("Mon") ahead of this one
      // shares the same hours.
      const all = pendingDays ? [...new Set([...pendingDays, ...days])] : days;
      applySpec(hours, all, spec);
      all.forEach((d) => touched.add(d));
      lastDays = all;
      pendingSpec = null; pendingDays = null;
    } else if (days.length && !spec) {
      if (pendingSpec) {
        applySpec(hours, days, pendingSpec);
        days.forEach((d) => touched.add(d));
        lastDays = days;
        pendingSpec = null;
      } else {
        pendingDays = days;
      }
    } else if (spec && !days.length) {
      if (pendingDays) {
        applySpec(hours, pendingDays, spec);
        pendingDays.forEach((d) => touched.add(d));
        lastDays = pendingDays;
        pendingDays = null;
      } else if (lastDays && spec.periods) {
        appendPeriods(hours, lastDays, spec.periods);
      } else if (pendingSpec && pendingSpec.periods && spec.periods) {
        // Two spec-only segments in a row are one place's split hours
        // ("12:30–3:15 pm, 7–11:15 pm") — accumulate, don't overwrite.
        pendingSpec = { periods: [...pendingSpec.periods, ...spec.periods] };
      } else {
        pendingSpec = spec;
      }
    } else {
      warnings.push(`Couldn't read: "${frag}"`);
    }
  }

  if (pendingSpec) {
    const rest = [0, 1, 2, 3, 4, 5, 6].filter((d) => !touched.has(d));
    applySpec(hours, rest.length ? rest : [0, 1, 2, 3, 4, 5, 6], pendingSpec);
    rest.forEach((d) => touched.add(d));
  }

  for (const ex of exceptions) {
    const days = parseDays(ex);
    const spec = parseSpec(stripDayWords(ex));
    // A parenthetical only overrides when it actually says something. "(daily)"
    // or "(Tuesday–Sunday)" is redundant scope, not "(closed)".
    const saysClosed = /clos|shut|rest\b|by appointment/i.test(ex) && !spec?.periods;
    if (days.length && saysClosed) {
      applySpec(hours, days, { closed: true });
      days.forEach((d) => touched.add(d));
    } else if (days.length && spec) {
      applySpec(hours, days, spec);
      days.forEach((d) => touched.add(d));
    }
  }

  if (!touched.size) warnings.push("Couldn't parse any days from that.");

  return { hours, warnings };
}

// Editor form shape -> stored shape: keep only days with a real period or an
// explicit closed flag. Returns undefined when nothing meaningful survives, so
// the caller can leave `openingHours` unset ("hours unknown").
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const toStoredHours = (form) => {
  if (!form) return undefined;
  if (form.is24Hours) return { is24Hours: true };
  const out = {};
  for (const key of DAY_KEYS) {
    const e = form[key];
    if (!e) continue;
    if (e.closed) { out[key] = { closed: true }; continue; }
    const periods = (e.periods || [])
      .filter((p) => p && HHMM.test(p.open || "") && HHMM.test(p.close || "") && p.open !== p.close)
      .map((p) => ({ open: p.open, close: p.close }));
    if (periods.length) out[key] = { closed: false, periods };
  }
  return Object.keys(out).length ? out : undefined;
};
