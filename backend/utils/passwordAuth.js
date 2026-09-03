import bcrypt from "bcryptjs";
import crypto from "crypto";

// A real bcrypt hash of a random value, generated once at boot, used as the
// stand-in when a login names an account that doesn't exist.
//
// It has to be a *valid* hash. The obvious shortcut — a hand-written string
// like "$2a$10$invalidinvalid..." — is not one: bcrypt parses the 22-character
// salt out of it, finds the encoding malformed and returns false immediately,
// without ever running the key derivation. That takes ~0 ms against ~105 ms for
// a genuine comparison, so the dummy compare that was supposed to hide whether
// an account exists announces it instead, in the response time.
//
// Nothing can produce this value's plaintext, so a comparison against it always
// fails — it exists purely to spend the same time a real one would.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);

// Compares a submitted password against a stored hash, falling back to the
// dummy when there is no stored hash to compare against. Callers still have to
// check that the account exists — this only equalises the work done, it does
// not decide the outcome.
export const verifyPassword = async (password, storedHash) =>
  bcrypt.compare(String(password ?? ""), storedHash || DUMMY_PASSWORD_HASH);
