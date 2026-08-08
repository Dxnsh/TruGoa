// scripts/backup.js
// Creates a compressed mongodump archive under backend/backups/.
// Requires the MongoDB Database Tools (mongodump) to be installed and on PATH.
// Usage: npm run backup
import "dotenv/config";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const backupsDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const archivePath = path.join(backupsDir, `trugoa-${timestamp}.gz`);

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set — check your .env file.");
  process.exit(1);
}

const mongodump = spawn("mongodump", [
  `--uri=${process.env.MONGO_URI}`,
  "--gzip",
  `--archive=${archivePath}`,
]);

mongodump.stdout.on("data", (data) => process.stdout.write(data));
mongodump.stderr.on("data", (data) => process.stderr.write(data));

mongodump.on("error", (err) => {
  console.error(
    "Failed to run mongodump. Is the MongoDB Database Tools package installed and on PATH?",
    err.message
  );
  process.exit(1);
});

mongodump.on("close", (code) => {
  if (code === 0) {
    console.log(`Backup written to ${archivePath}`);
  } else {
    console.error(`mongodump exited with code ${code}`);
    process.exit(code);
  }
});
