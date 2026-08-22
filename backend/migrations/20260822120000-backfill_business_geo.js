// Backfills `geo` for businesses that have coordinates but no GeoJSON point.
//
// 20260814090000-business_geo_point.js already did this once, but at the time
// no business had coordinates at all, so it backfilled nothing. Pins added
// since then went in through the admin edit path, where the sync hook was
// silently failing: Mongoose's timestamps plugin adds a $set of its own for
// updatedAt, so the hook's `update.$set || update` read a bag holding only
// updatedAt, found no coordinates, and returned early. The listings saved
// their latitude and longitude and never got a point — which left them
// invisible to $geoNear, and the deck falling back to "In your part of Goa"
// for everyone.
//
// The hook is fixed, but a fix only helps the next save. This repairs the
// documents already written.
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
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // Deliberately a no-op. The only thing this migration did was derive `geo`
  // from coordinates already on the document, so there is nothing here that
  // isn't reproducible by running `up` again. Unsetting `geo` on the way down
  // would also strip the points the earlier migration created, taking
  // proximity search offline to undo a repair.
};
