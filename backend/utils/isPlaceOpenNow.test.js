import test from "node:test";
import assert from "node:assert/strict";
import { isPlaceOpenNow, decorateOpenState, passesOpenNowFilter } from "./isPlaceOpenNow.js";

// All checks are made in Asia/Kolkata (UTC+5:30, no DST). The helper below takes
// an IST weekday + wall-clock time and returns the absolute instant, so each
// test reads in the timezone the code actually cares about.
//   IST = UTC + 5:30, so IST 00:00 is UTC 18:30 the previous day.
const IST_DATES = {
  // A week in Jan 2026: the 4th is a Sunday.
  sunday: "2026-01-04", monday: "2026-01-05", tuesday: "2026-01-06",
  wednesday: "2026-01-07", thursday: "2026-01-08", friday: "2026-01-09",
  saturday: "2026-01-10",
};
const istInstant = (day, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  // Subtract the 5:30 offset to get UTC.
  let utcMin = h * 60 + m - (5 * 60 + 30);
  let date = IST_DATES[day];
  if (utcMin < 0) {
    utcMin += 1440;
    // roll the date back one day
    const prev = { sunday: "saturday", monday: "sunday", tuesday: "monday",
      wednesday: "tuesday", thursday: "wednesday", friday: "thursday", saturday: "friday" };
    date = IST_DATES[prev[day]];
  }
  const hh = String(Math.floor(utcMin / 60)).padStart(2, "0");
  const mm = String(utcMin % 60).padStart(2, "0");
  return new Date(`${date}T${hh}:${mm}:00Z`);
};

// A day, from one or more "HH:MM-HH:MM" period strings.
const day = (...spans) => ({
  closed: false,
  periods: spans.map((s) => {
    const [open, close] = s.split("-");
    return { open, close };
  }),
});
const everyDay = (...spans) => {
  const d = day(...spans);
  return { monday: d, tuesday: d, wednesday: d, thursday: d, friday: d, saturday: d, sunday: d };
};

test("normal same-day hours — during, before and after", () => {
  const hours = everyDay("09:00-22:00");

  const during = isPlaceOpenNow(hours, istInstant("monday", "12:00"));
  assert.equal(during.isOpen, true);
  assert.equal(during.status, "open");
  assert.equal(during.closesAt, "22:00");
  assert.equal(during.closesInMinutes, 600);

  const before = isPlaceOpenNow(hours, istInstant("monday", "08:00"));
  assert.equal(before.isOpen, false);
  assert.equal(before.status, "closed");
  assert.equal(before.opensAt, "09:00");
  assert.equal(before.nextOpenTime, "Today 09:00");

  const after = isPlaceOpenNow(hours, istInstant("monday", "23:00"));
  assert.equal(after.isOpen, false);
  assert.equal(after.nextOpenTime, "Tomorrow 09:00");
});

test("split hours in a day (lunch + dinner service)", () => {
  const hours = everyDay("10:00-14:00", "15:30-19:30");

  // Lunch service.
  const lunch = isPlaceOpenNow(hours, istInstant("monday", "12:00"));
  assert.equal(lunch.isOpen, true);
  assert.equal(lunch.closesAt, "14:00");

  // The afternoon break — closed, reopens 15:30 today.
  const siesta = isPlaceOpenNow(hours, istInstant("monday", "14:30"));
  assert.equal(siesta.isOpen, false);
  assert.equal(siesta.status, "closed");
  assert.equal(siesta.nextOpenTime, "Today 15:30");

  // Dinner service.
  const dinner = isPlaceOpenNow(hours, istInstant("monday", "18:00"));
  assert.equal(dinner.isOpen, true);
  assert.equal(dinner.closesAt, "19:30");

  // After close — reopens tomorrow at the first period.
  const shut = isPlaceOpenNow(hours, istInstant("monday", "21:00"));
  assert.equal(shut.nextOpenTime, "Tomorrow 10:00");
});

test("overnight hours crossing midnight", () => {
  const hours = everyDay("18:00-02:00");

  // Evening — open, closes after midnight.
  const evening = isPlaceOpenNow(hours, istInstant("friday", "20:00"));
  assert.equal(evening.isOpen, true);
  assert.equal(evening.closesAt, "02:00");
  assert.equal(evening.closesInMinutes, 6 * 60); // 20:00 → 02:00

  // 01:00 — still open, on the previous day's window.
  const lateNight = isPlaceOpenNow(hours, istInstant("saturday", "01:00"));
  assert.equal(lateNight.isOpen, true);
  assert.equal(lateNight.closesAt, "02:00");
  assert.equal(lateNight.closesInMinutes, 60);

  // 03:00 — shut, reopens at 18:00 today.
  const preDawn = isPlaceOpenNow(hours, istInstant("saturday", "03:00"));
  assert.equal(preDawn.isOpen, false);
  assert.equal(preDawn.nextOpenTime, "Today 18:00");
});

test("24-hour places are always open", () => {
  const hours = { is24Hours: true };
  for (const t of ["00:00", "04:30", "12:00", "23:59"]) {
    const r = isPlaceOpenNow(hours, istInstant("wednesday", t));
    assert.equal(r.isOpen, true);
    assert.equal(r.status, "open");
    assert.equal(r.closesAt, null);
  }
});

test("closed-today falls through to the next open day", () => {
  const hours = {
    ...everyDay("09:00-18:00"),
    monday: { closed: true },
  };
  const r = isPlaceOpenNow(hours, istInstant("monday", "12:00"));
  assert.equal(r.isOpen, false);
  assert.equal(r.status, "closed");
  assert.equal(r.nextOpenTime, "Tomorrow 09:00");
});

test("missing / unset / empty hours → unknown, never filtered out", () => {
  for (const input of [undefined, null, {}, { is24Hours: false }, { monday: {} }, { monday: { periods: [] } }]) {
    const r = isPlaceOpenNow(input, istInstant("monday", "12:00"));
    assert.equal(r.status, "unknown", `input ${JSON.stringify(input)}`);
    assert.equal(r.isOpen, false);
  }
  assert.equal(passesOpenNowFilter({ openStatus: "unknown" }), true);
  assert.equal(passesOpenNowFilter({ openStatus: "open" }), true);
  assert.equal(passesOpenNowFilter({ openStatus: "closed" }), false);
});

// Regression: a legacy free-text `openingHours` string (the shape stored before
// the structured migration) must read as "unknown" — always shown, never
// filtered — not crash and not be treated as closed. This is exactly the state
// production was in when "open now" looked broken: every listing still held a
// string, so nothing ever filtered.
test("legacy free-text openingHours string → unknown, still shown", () => {
  for (const legacy of [
    "10 AM – 1 AM daily (Closed Tuesdays)",
    "9:00 AM – 6:00 PM daily",
    "Check-in: 2:00 PM · Check-out: 11:00 AM",
    "",
  ]) {
    const r = isPlaceOpenNow(legacy, istInstant("wednesday", "15:00"));
    assert.equal(r.status, "unknown", `legacy string ${JSON.stringify(legacy)}`);
    assert.equal(passesOpenNowFilter({ openStatus: r.status }), true);
  }
});

test("boundary minutes: open-minute is open, close-minute is closed", () => {
  const hours = everyDay("09:00-17:00");
  assert.equal(isPlaceOpenNow(hours, istInstant("tuesday", "09:00")).isOpen, true);
  assert.equal(isPlaceOpenNow(hours, istInstant("tuesday", "16:59")).isOpen, true);
  assert.equal(isPlaceOpenNow(hours, istInstant("tuesday", "17:00")).isOpen, false);
});

test("the check is anchored to IST, not UTC", () => {
  // Sunday 22:00–23:00 only. Instant is UTC Sun 23:00 — which is Monday 04:30
  // in IST, so the Sunday window must NOT count as "yesterday still open" and
  // the place reads closed.
  const hours = { sunday: day("22:00-23:00") };
  const r = isPlaceOpenNow(hours, new Date("2026-01-04T23:00:00Z"));
  assert.equal(r.isOpen, false);
  assert.equal(r.status, "closed");

  // Same wall-clock intent, checked at IST Sunday 22:30 (UTC Sun 17:00) → open.
  const openNow = isPlaceOpenNow(hours, new Date("2026-01-04T17:00:00Z"));
  assert.equal(openNow.isOpen, true);
});

test("decorateOpenState flattens onto the place object and maps arrays", () => {
  const open = everyDay("00:00-23:59");
  const one = decorateOpenState({ name: "X", openingHours: open }, istInstant("monday", "12:00"));
  assert.equal(one.name, "X");
  assert.equal(one.isOpenNow, true);
  assert.equal(one.openStatus, "open");

  const many = decorateOpenState(
    [{ openingHours: undefined }, { openingHours: { monday: { closed: true } } }],
    istInstant("monday", "12:00")
  );
  assert.equal(many[0].openStatus, "unknown");
  assert.equal(many[1].openStatus, "closed");
});
