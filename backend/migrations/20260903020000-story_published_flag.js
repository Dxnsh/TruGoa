// Backfills the new `published` flag on stories.
//
// Public story routes now filter on `published: true`, and the model defaults it
// to false so a newly created story is a draft. Every story that already exists
// was publicly visible before the flag did, so they are backfilled as published
// — without this they would all disappear from the site the moment the filter
// shipped. Mirrors what 20260820103000-blogs_to_journals.js did for journals.

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db) => {
  const result = await db.collection("stories").updateMany(
    { published: { $exists: false } },
    { $set: { published: true } }
  );
  console.log(`[migration] stories backfilled as published: ${result.modifiedCount}`);

  await db.collection("stories").createIndex({ published: 1 });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db) => {
  await db.collection("stories").dropIndex("published_1").catch(() => {});
  await db.collection("stories").updateMany({}, { $unset: { published: "" } });
};
