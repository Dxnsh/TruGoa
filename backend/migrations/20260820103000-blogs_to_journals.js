// Renames the `blogs` collection to `journals` and backfills the new
// `published` flag.
//
// The feature was renamed from "blog"/"guides" to "Journal", and the Mongoose
// model now maps to `journals`. Without this rename every existing entry would
// simply vanish from the site — the documents would still be sitting in the old
// collection that nothing reads any more.
//
// Existing entries were all publicly visible before the flag existed, so they
// are backfilled as `published: true`. New entries default to false (draft) so
// nothing goes live until it's marked published in the dashboard.

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const names = await db.listCollections({}, { nameOnly: true }).toArray();
  const has = (name) => names.some((c) => c.name === name);

  if (has("blogs")) {
    if (has("journals")) {
      // A partially-applied run, or entries created after the rename. Move the
      // stragglers across rather than clobbering what's already there.
      const leftovers = await db.collection("blogs").find().toArray();
      if (leftovers.length) {
        await db.collection("journals").insertMany(leftovers, { ordered: false })
          .catch(() => { /* duplicate _ids mean they're already migrated */ });
      }
      await db.collection("blogs").drop();
    } else {
      await db.collection("blogs").rename("journals");
    }
    console.log("[migration] blogs -> journals");
  } else {
    console.log("[migration] no blogs collection — nothing to rename");
  }

  const result = await db.collection("journals").updateMany(
    { published: { $exists: false } },
    { $set: { published: true } }
  );
  console.log(`[migration] marked ${result.modifiedCount} existing entries as published`);

  await db.collection("journals").createIndex({ published: 1 });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  const names = await db.listCollections({ name: "journals" }, { nameOnly: true }).toArray();
  if (!names.length) return;

  await db.collection("journals").dropIndex("published_1").catch(() => {
    // Index may not exist if `up` failed partway — nothing to undo.
  });
  await db.collection("journals").updateMany({}, { $unset: { published: "" } });
  await db.collection("journals").rename("blogs");
};
