// scripts/restore.js
// Restores a mongodump archive created by scripts/backup.js.
// Requires the MongoDB Database Tools (mongorestore) to be installed and on PATH.
// Usage: npm run restore -- backups/trugoa-<timestamp>.gz
import "dotenv/config";
import { spawn } from "child_process";
import fs from "fs";

const archivePath = process.argv[2];

if (!archivePath) {
  console.error("Usage: npm run restore -- <path-to-archive.gz>");
  process.exit(1);
}

if (!fs.existsSync(archivePath)) {
  console.error(`Archive not found: ${archivePath}`);
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set — check your .env file.");
  process.exit(1);
}

// --drop replaces existing collections with the archive's contents, rather
// than merging — the expected behavior when restoring to recover from a bad state.
const mongorestore = spawn("mongorestore", [
  `--uri=${process.env.MONGO_URI}`,
  "--gzip",
  `--archive=${archivePath}`,
  "--drop",
]);

mongorestore.stdout.on("data", (data) => process.stdout.write(data));
mongorestore.stderr.on("data", (data) => process.stderr.write(data));

mongorestore.on("error", (err) => {
  console.error(
    "Failed to run mongorestore. Is the MongoDB Database Tools package installed and on PATH?",
    err.message
  );
  process.exit(1);
});

mongorestore.on("close", (code) => {
  if (code === 0) {
    console.log(`Restored from ${archivePath}`);
  } else {
    console.error(`mongorestore exited with code ${code}`);
    process.exit(code);
  }
});
