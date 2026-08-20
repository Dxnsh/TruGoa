import AdminUser from "../models/AdminUser.js";
import { logger } from "./logger.js";

// Creates the first owner account from ADMIN_EMAIL / ADMIN_PASSWORD_HASH when
// the collection is empty.
//
// Without this, moving logins from env vars to the database would lock everyone
// out the moment it deployed: no accounts exist yet, and the only screen that
// can create one is behind the login. So the existing env credentials become
// the first owner, and that owner invites everyone else from the dashboard.
//
// It runs on every boot but only ever acts on an empty collection, so once a
// real account exists the env vars stop mattering and can be deleted.
export const bootstrapAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  const existing = await AdminUser.estimatedDocumentCount();
  if (existing > 0) return;

  if (!email || !passwordHash) {
    logger.error(
      "No admin accounts exist and ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not both set — " +
      "nobody can sign in to the dashboard. Set them and restart to seed the first owner."
    );
    return;
  }

  // A bcrypt hash always starts with $2. Catching a pasted plaintext password
  // here is worth it: stored as-is it would fail every login with the same
  // "invalid credentials" as a wrong password, which is near-impossible to
  // diagnose from the outside.
  if (!passwordHash.startsWith("$2")) {
    logger.error(
      "ADMIN_PASSWORD_HASH does not look like a bcrypt hash (expected it to start with '$2'). " +
      "It must be the hash, not the plaintext password — refusing to seed the first owner."
    );
    return;
  }

  await AdminUser.create({
    name: "Owner",
    email,
    passwordHash,
    role: "owner",
    active: true,
  });

  logger.info(`Seeded the first admin owner from env vars: ${email}`);
};
