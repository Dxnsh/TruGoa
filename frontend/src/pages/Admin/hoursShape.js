// Pure opening-hours shape + serialisers. No React / theme / api imports, so
// the paste parser and its tests can pull it in on their own.
//
// A day holds a list of `periods` — split hours ("10:00–14:00 & 15:30–19:30")
// are common for kitchens and temples, so a single window is just a one-entry
// list. `closed` wins over any periods.

export const HOURS_DAY_KEYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

// Day labels, in the Monday-first order the editor and detail page render.
export const HOURS_DAYS = [
  ["monday", "Monday"], ["tuesday", "Tuesday"], ["wednesday", "Wednesday"],
  ["thursday", "Thursday"], ["friday", "Friday"], ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];

export const BLANK_PERIOD = { open: "", close: "" };
export const BLANK_DAY = { closed: false, periods: [{ ...BLANK_PERIOD }] };

export const blankOpeningHours = () => ({
  ...Object.fromEntries(
    HOURS_DAY_KEYS.map((k) => [k, { closed: false, periods: [{ ...BLANK_PERIOD }] }])
  ),
  is24Hours: false,
});

// Business doc → editor state: every day gets at least one (possibly blank)
// period row so the grid renders. Tolerates a legacy single { open, close } day.
export const openingHoursToForm = (oh) => {
  const base = blankOpeningHours();
  if (!oh || typeof oh !== "object") return base;
  base.is24Hours = oh.is24Hours === true;
  for (const key of HOURS_DAY_KEYS) {
    const e = oh[key];
    if (!e || typeof e !== "object") continue;
    const periods = Array.isArray(e.periods) && e.periods.length
      ? e.periods.map((p) => ({ open: p.open || "", close: p.close || "" }))
      : (e.open || e.close ? [{ open: e.open || "", close: e.close || "" }] : [{ ...BLANK_PERIOD }]);
    base[key] = { closed: e.closed === true, periods };
  }
  return base;
};

// Editor state → payload. Blank/half-filled period rows are dropped (the API
// also normalises); returns undefined when nothing meaningful is set so the
// field clears rather than storing an empty shell.
export const openingHoursFromForm = (form) => {
  if (!form) return undefined;
  if (form.is24Hours) return { is24Hours: true };
  const out = {};
  let any = false;
  for (const key of HOURS_DAY_KEYS) {
    const e = form[key] || BLANK_DAY;
    if (e.closed) { out[key] = { closed: true }; any = true; continue; }
    const periods = (e.periods || [])
      .filter((p) => p && p.open && p.close)
      .map((p) => ({ open: p.open, close: p.close }));
    if (periods.length) { out[key] = { closed: false, periods }; any = true; }
  }
  return any ? out : undefined;
};
