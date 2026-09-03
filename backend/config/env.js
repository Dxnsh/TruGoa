import dotenv from "dotenv";

// ESM evaluates every import before the importing module's own statements, so
// this file is reached before server.js runs its dotenv.config(). Reading
// NODE_ENV without loading .env here saw it as unset and put local runs into
// production mode. dotenv never overrides a variable the host already set, so
// calling it again is free.
dotenv.config({ quiet: true });
// One place decides whether this process is in development mode.
//
// NODE_ENV used to be read directly in five places, each phrased differently:
// two asked `=== "production"` and failed open when the variable was unset
// (the HTTPS redirect became a no-op, and 5xx stack traces were returned to
// callers), while three asked `!== "development"` and failed safe. A single
// unset variable on the host therefore switched some protections off and left
// others on, which is impossible to reason about.
//
// The default is inverted here: anything that is not an explicit opt-in to
// development is treated as production. A missing NODE_ENV now costs a
// developer some local conveniences instead of silently exposing a deployment.
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = !isDevelopment;

// What the process actually sees, for /health and the boot log. Reported as
// "unset" rather than defaulted, so an operator can tell a missing variable
// from one explicitly set to "production".
export const nodeEnv = process.env.NODE_ENV || "unset";
