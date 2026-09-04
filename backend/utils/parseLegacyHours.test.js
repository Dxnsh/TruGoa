import test from "node:test";
import assert from "node:assert/strict";
import { parseHoursText, toStoredHours } from "./parseLegacyHours.js";

// The parser behind the admin "Paste hours" box and the legacy-hours migration.
// Cases here are the real production string formats that used to break it.

const stored = (s) => toStoredHours(parseHoursText(s).hours);
const warns = (s) => parseHoursText(s).warnings;

test("plain daily hours", () => {
  const h = stored("9:00 AM – 6:00 PM daily");
  assert.deepEqual(h.monday, { closed: false, periods: [{ open: "09:00", close: "18:00" }] });
  assert.deepEqual(h.sunday, { closed: false, periods: [{ open: "09:00", close: "18:00" }] });
  assert.equal(warns("9:00 AM – 6:00 PM daily").length, 0);
});

test("trailing period after the hours does not break parsing", () => {
  // "…daily." — the stray period, once "daily" is stripped, left a dangling
  // " ." that failed the time match.
  const h = stored("8:00 AM–11:00 PM daily.");
  assert.deepEqual(h.tuesday, { closed: false, periods: [{ open: "08:00", close: "23:00" }] });
  assert.equal(warns("8:00 AM–11:00 PM daily.").length, 0);
});

test("a non-'closed' parenthetical is scope, not '(closed)'", () => {
  // "(daily)" was being read as "(closed)" and shutting every day.
  const h = stored("12:30 pm – 3:15 pm, 7 pm – 11:15 pm (daily)");
  assert.deepEqual(h.wednesday.periods, [
    { open: "12:30", close: "15:15" },
    { open: "19:00", close: "23:15" },
  ]);
});

test("(Closed <day>) exception still works", () => {
  const h = stored("10 AM – 1 AM daily (Closed Tuesdays)");
  assert.equal(h.tuesday.closed, true);
  assert.deepEqual(h.monday.periods, [{ open: "10:00", close: "01:00" }]); // crosses midnight
});

test("'; closed Mondays' does not wipe the daily hours", () => {
  const h = stored("10 AM – 6:30 PM; closed Mondays");
  assert.equal(h.monday.closed, true);
  assert.deepEqual(h.wednesday.periods, [{ open: "10:00", close: "18:30" }]);
});

test("split hours separated only by a space", () => {
  const h = stored("11:30 am–4 pm 6:30–11:30 pm daily");
  assert.deepEqual(h.friday.periods, [
    { open: "11:30", close: "16:00" },
    { open: "18:30", close: "23:30" },
  ]);
});

test("bare afternoon window in a second period is read as PM", () => {
  // "10–2 & 3:30–7:30" — the 3:30 is the afternoon, not the small hours.
  const h = stored("10–2 & 3:30–7:30, Mon–Sat");
  assert.deepEqual(h.monday.periods, [
    { open: "10:00", close: "14:00" },
    { open: "15:30", close: "19:30" },
  ]);
  assert.equal(h.sunday, undefined); // not in Mon–Sat
});

test("day range + a standalone day both count", () => {
  const h = stored("Mon, Wed–Sun: 8:30 am – 1 am · Tue: Closed");
  assert.deepEqual(h.monday.periods, [{ open: "08:30", close: "01:00" }]);
  assert.equal(h.tuesday.closed, true);
  assert.deepEqual(h.sunday.periods, [{ open: "08:30", close: "01:00" }]);
});

test("different Sunday hours", () => {
  const h = stored("9:30–6:30 Mon–Sat, 10–1 Sun");
  assert.deepEqual(h.saturday.periods, [{ open: "09:30", close: "18:30" }]);
  assert.deepEqual(h.sunday.periods, [{ open: "10:00", close: "13:00" }]);
});

test("24 hours", () => {
  assert.deepEqual(toStoredHours(parseHoursText("Open 24 hours").hours), { is24Hours: true });
  assert.deepEqual(toStoredHours(parseHoursText("24/7").hours), { is24Hours: true });
});

test("unparseable prose yields no structured hours and a warning", () => {
  for (const s of [
    "Generally open during morning and evening worship hours.",
    "Check-in: 2:00 PM · Check-out: 11:00 AM",
    "Late night, from around 1 AM onward — this is when it comes alive.",
  ]) {
    assert.equal(stored(s), undefined, s);
    assert.ok(parseHoursText(s).warnings.length > 0, s);
  }
});

test("a window that looked like a range but didn't parse is flagged", () => {
  // Migration relies on 'zero warnings' to gate auto-conversion, so a dropped
  // period must surface as a warning rather than silently vanishing.
  const { warnings } = parseHoursText(
    "Tuesday–Sunday: 11:30 AM–3:00 PM and 7:00 PM–11:00 PM. Monday: Closed"
  );
  assert.ok(warnings.length > 0);
});
