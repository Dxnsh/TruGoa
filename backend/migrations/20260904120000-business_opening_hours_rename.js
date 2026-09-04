// `openingHours` used to be a freeform display string ("10 AM – 1 AM daily
// (Closed Tuesdays)"). It is now a structured per-day object that drives the
// site-wide "open now" filter and badge (models/Business.js +
// utils/isPlaceOpenNow.js). The new code correctly treats a *string* value as
// "hours unknown" — always shown, never filtered — so until this migration runs
// on a database, every legacy listing sits in the feed regardless of its hours
// and the whole feature looks broken.
//
// This migration, per legacy listing with a string `openingHours`:
//   1. keeps the original text as `openingHoursNote` (still shown on the detail
//      page and pre-filled in the admin editor's note field);
//   2. runs the text through the exact parser behind the admin "Paste hours"
//      box (utils/parseLegacyHours.js). If it parses to structured hours with
//      NO warnings, that becomes `openingHours`. Anything ambiguous —
//      "Generally open during worship hours", hotel check-in/out lines, a
//      window the parser flagged — is left unset (note-only) for an admin to
//      enter by hand via the paste flow.
//
// Every listing's outcome is logged. `down` restores the original string.

import { parseHoursText, toStoredHours } from "../utils/parseLegacyHours.js";

/**
 * @param db {import('mongodb').Db}
 */
export const up = async (db) => {
  const businesses = db.collection("businesses");
  const docs = await businesses
    .find({ openingHours: { $type: "string" } })
    .project({ name: 1, openingHours: 1 })
    .toArray();

  let converted = 0;
  let noteOnly = 0;
  let cleared = 0;

  for (const doc of docs) {
    const original = String(doc.openingHours || "").trim();
    const set = {};
    const unset = {};

    if (original) set.openingHoursNote = original;
    else unset.openingHoursNote = "";

    let structured;
    if (original) {
      const { hours, warnings } = parseHoursText(original);
      const stored = toStoredHours(hours);
      if (stored && warnings.length === 0) structured = stored;
      if (warnings.length && stored) {
        console.log(`[migration]   flagged (note only): ${doc.name} — ${warnings.join("; ")}`);
      }
    }

    if (structured) {
      set.openingHours = structured;
      converted++;
      console.log(`[migration]   parsed: ${doc.name}  ::  ${JSON.stringify(original)}`);
    } else {
      unset.openingHours = "";
      original ? noteOnly++ : cleared++;
    }

    const update = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;
    await businesses.updateOne({ _id: doc._id }, update);
  }

  console.log(
    `[migration] legacy hours: ${docs.length} string listings — ` +
    `${converted} parsed to structured, ${noteOnly} kept as note only, ${cleared} empty cleared`
  );
};

/**
 * @param db {import('mongodb').Db}
 */
export const down = async (db) => {
  const businesses = db.collection("businesses");

  // Put the freeform note back under openingHours as a string.
  const restored = await businesses.updateMany(
    { openingHoursNote: { $type: "string" } },
    [
      { $set: { openingHours: "$openingHoursNote" } },
      { $unset: "openingHoursNote" },
    ]
  );
  console.log(`[migration] restored ${restored.modifiedCount} openingHoursNote -> openingHours string`);

  // Drop any structured object (parsed data has no home in the old shape).
  const dropped = await businesses.updateMany(
    { openingHours: { $type: "object" } },
    { $unset: { openingHours: "" } }
  );
  console.log(`[migration] dropped ${dropped.modifiedCount} structured openingHours objects`);
};
