// Baseline migration — establishes the migrate-mongo changelog starting point.
// All indexes below already exist (created by Mongoose from each model's
// schema definition on connect: models/Business.js, models/Review.js,
// models/Tourist.js). This migration doesn't create anything new — it's a
// no-op checkpoint so every schema change from this point forward goes
// through a tracked migration file instead of being applied ad hoc.

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  // No-op — see comment above.
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // No-op — see comment above.
};
