// scripts/restore-drill.mjs
//
// Proves a backup is actually restorable — the half of "we have backups" that
// people skip until the day it matters.
//
// It NEVER writes to the database in MONGO_URI. It restores into a separate
// scratch database and verifies it against the live one, collection by
// collection, then drops the scratch database again.
//
// ── Usage ────────────────────────────────────────────────────────────────────
//
//   FULL DRILL (dumps MONGO_URI, restores it into a scratch db, verifies):
//     npm run restore:drill
//   Requires the MongoDB Database Tools (mongodump / mongorestore) on PATH:
//     https://www.mongodb.com/docs/database-tools/installation/
//
//   VERIFY ONLY (you already restored a snapshot somewhere — e.g. via the Atlas
//   UI "restore to a different cluster/database" — and just want it checked):
//     npm run restore:drill -- --verify-only "mongodb+srv://.../trugoa_restored"
//
//   Keep the scratch database instead of dropping it at the end:
//     npm run restore:drill -- --keep
//
// ── Exit codes ───────────────────────────────────────────────────────────────
//   0  every live collection is present and populated in the restored copy
//   1  a collection is missing or came back empty  -> the backup is NOT safe
//   2  couldn't run the drill (missing tools, bad URI, connection failure)

import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const KEEP = args.includes("--keep");
const verifyOnlyIdx = args.indexOf("--verify-only");
const VERIFY_ONLY_TARGET = verifyOnlyIdx !== -1 ? args[verifyOnlyIdx + 1] : null;

const SRC_URI = process.env.MONGO_URI;
if (!SRC_URI) {
  console.error("MONGO_URI is not set — check backend/.env (or the host environment).");
  process.exit(2);
}

// mongodb+srv://user:pass@host/<dbName>?opts  ->  { base, dbName }
// `base` is the same URI with the /<dbName> path removed, so mongorestore can be
// told the destination namespace explicitly via --nsTo.
const parseUri = (uri) => {
  const u = new URL(uri);
  const dbName = u.pathname.replace(/^\//, "") || "test";
  u.pathname = "/";
  return { base: u.toString(), dbName };
};

const { base: SRC_BASE, dbName: SRC_DB } = parseUri(SRC_URI);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const SCRATCH_DB = `${SRC_DB}_restoredrill_${stamp}`;

const run = (cmd, cmdArgs) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ["ignore", "inherit", "inherit"] });
    p.on("error", (err) =>
      reject(
        new Error(
          `Could not run "${cmd}". Install the MongoDB Database Tools and put them on PATH: ` +
            `https://www.mongodb.com/docs/database-tools/installation/  (${err.message})`
        )
      )
    );
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))
    );
  });

const collectionCounts = async (uri) => {
  const conn = await mongoose.createConnection(uri).asPromise();
  try {
    const cols = (await conn.db.listCollections().toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith("system."))
      .sort();
    const counts = {};
    for (const name of cols) counts[name] = await conn.db.collection(name).countDocuments();
    return counts;
  } finally {
    await conn.close();
  }
};

// Ephemeral, self-refilling collections — shown in the table but never allowed
// to fail the drill, because their count legitimately swings to/from zero
// between the dump and the verification.
const EPHEMERAL = new Set(["ratelimits", "changelog_lock"]);

const report = (live, restored) => {
  const names = [...new Set([...Object.keys(live), ...Object.keys(restored)])].sort();
  const pad = Math.max(12, ...names.map((n) => n.length));
  console.log(`\n  ${"collection".padEnd(pad)}   ${"live".padStart(9)}   ${"restored".padStart(9)}   status`);
  console.log(`  ${"-".repeat(pad)}   ${"-".repeat(9)}   ${"-".repeat(9)}   ------`);

  let failed = false;
  for (const name of names) {
    const l = live[name];
    const r = restored[name];
    const ephemeral = EPHEMERAL.has(name);
    let status;
    if (r === undefined) {
      status = ephemeral ? "missing (ephemeral, ok)" : "MISSING from restore";
      if (!ephemeral) failed = true;
    } else if (l === undefined) {
      status = "extra in restore (ok)";
    } else if (l > 0 && r === 0) {
      status = ephemeral ? "empty (ephemeral, ok)" : "EMPTY in restore";
      if (!ephemeral) failed = true;
    } else if (r < l) {
      status = `${l - r} fewer (writes since dump? review)`;
    } else if (r > l) {
      status = `${r - l} more (writes since dump? review)`;
    } else {
      status = "match";
    }
    console.log(
      `  ${name.padEnd(pad)}   ${String(l ?? "-").padStart(9)}   ${String(r ?? "-").padStart(9)}   ${status}`
    );
  }
  return !failed;
};

let tmpDir;
let restoredUri;

try {
  if (VERIFY_ONLY_TARGET) {
    console.log(`Verify-only mode — comparing live (${SRC_DB}) against: ${VERIFY_ONLY_TARGET}`);
    restoredUri = VERIFY_ONLY_TARGET;
  } else {
    tmpDir = mkdtempSync(join(tmpdir(), "trugoa-drill-"));
    const archive = join(tmpDir, "dump.gz");

    console.log(`1/3  Dumping "${SRC_DB}" from MONGO_URI ...`);
    await run("mongodump", [`--uri=${SRC_URI}`, "--gzip", `--archive=${archive}`]);

    console.log(`2/3  Restoring into scratch database "${SCRATCH_DB}" (live data untouched) ...`);
    await run("mongorestore", [
      `--uri=${SRC_BASE}`,
      "--gzip",
      `--archive=${archive}`,
      `--nsInclude=${SRC_DB}.*`,
      `--nsFrom=${SRC_DB}.*`,
      `--nsTo=${SCRATCH_DB}.*`,
      "--drop",
    ]);

    const u = new URL(SRC_BASE);
    u.pathname = `/${SCRATCH_DB}`;
    restoredUri = u.toString();
  }

  console.log(`3/3  Verifying ...`);
  const [live, restored] = await Promise.all([
    collectionCounts(SRC_URI),
    collectionCounts(restoredUri),
  ]);

  const ok = report(live, restored);

  const liveTotal = Object.values(live).reduce((a, b) => a + b, 0);
  const restoredTotal = Object.values(restored).reduce((a, b) => a + b, 0);
  console.log(`\n  totals: live ${liveTotal} docs, restored ${restoredTotal} docs`);

  if (ok && restoredTotal > 0) {
    console.log("\n✓  RESTORE DRILL PASSED — every live collection is present and populated in the restore.");
  } else {
    console.log("\n✗  RESTORE DRILL FAILED — see the rows above. Do not rely on this backup path.");
  }

  if (!VERIFY_ONLY_TARGET && !KEEP) {
    const conn = await mongoose.createConnection(restoredUri).asPromise();
    await conn.dropDatabase();
    await conn.close();
    console.log(`\n(cleaned up scratch database "${SCRATCH_DB}")`);
  } else if (!VERIFY_ONLY_TARGET) {
    console.log(`\n(kept scratch database "${SCRATCH_DB}" — drop it yourself when done)`);
  }

  process.exit(ok && restoredTotal > 0 ? 0 : 1);
} catch (err) {
  console.error(`\nDrill could not complete: ${err.message}`);
  process.exit(2);
} finally {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
}
