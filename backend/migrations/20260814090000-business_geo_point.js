// Adds the GeoJSON `geo` field + 2dsphere index to businesses so the
// "places near me" swipe deck can run $geoNear against existing data.
//
// Every business already stores flat `latitude`/`longitude` numbers, but Mongo
// can't run proximity queries against those — it needs a GeoJSON Point with a
// 2dsphere index. This backfills `geo` from the coordinates already on each
// document, so no data re-entry is needed.
//
// Documents missing either coordinate are skipped deliberately: writing a
// partial or zeroed point would place them at [0,0] in the Atlantic and let
// them surface as "nearby" for users anywhere.

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const result = await db.collection("businesses").updateMany(
    {
      latitude:  { $type: "number" },
      longitude: { $type: "number" },
      geo: { $exists: false },
    },
    [
      {
        $set: {
          geo: {
            type: "Point",
            // GeoJSON is longitude-first — the reverse of how the flat
            // fields read. Swapping these silently maps Goa into Somalia.
            coordinates: ["$longitude", "$latitude"],
          },
        },
      },
    ]
  );

  console.log(`[migration] backfilled geo on ${result.modifiedCount} businesses`);

  await db.collection("businesses").createIndex({ geo: "2dsphere" });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  await db.collection("businesses").dropIndex("geo_2dsphere").catch(() => {
    // Index may not exist if `up` failed partway — nothing to undo.
  });
  await db.collection("businesses").updateMany({}, { $unset: { geo: "" } });
};
