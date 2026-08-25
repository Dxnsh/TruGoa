// Repairs journal slugs that can't be reached through a URL.
//
// One entry was saved as "/things-to-do-in-goa" — a leading slash, most likely
// pasted from a path. It stored without complaint and then 404'd on every
// visit: the browser normalises the path before sending it, so the request
// arrives as "things-to-do-in-goa" and never matches the stored value. The
// entry was published and looked fine in the dashboard the whole time.
//
// The controller now normalises on write, but that only helps the next save.
// This fixes what's already stored.
//
// Only the slug is touched. Anything that normalises to nothing is left alone
// rather than blanked — an empty slug is no more reachable than a bad one, and
// a human should decide what those should be called.

const normaliseSlug = (value) => {
  const lastSegment = String(value ?? "").split("/").filter(Boolean).pop() ?? "";
  return lastSegment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const journals = await db.collection("journals").find({}, { projection: { slug: 1 } }).toArray();

  let fixed = 0;
  for (const entry of journals) {
    const clean = normaliseSlug(entry.slug);
    if (!clean || clean === entry.slug) continue;

    // A collision would mean two entries claiming one URL; leave both and say
    // so rather than picking a winner.
    const taken = await db.collection("journals").findOne({ slug: clean, _id: { $ne: entry._id } });
    if (taken) {
      console.log(`[migration] skipped "${entry.slug}" — "${clean}" is already taken`);
      continue;
    }

    await db.collection("journals").updateOne({ _id: entry._id }, { $set: { slug: clean } });
    console.log(`[migration] "${entry.slug}" -> "${clean}"`);
    fixed += 1;
  }

  console.log(`[migration] normalised ${fixed} journal slug(s)`);
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // Deliberately a no-op. The old values were unreachable URLs; restoring them
  // would only put the 404s back, and the originals aren't worth recording to
  // make that possible.
};
