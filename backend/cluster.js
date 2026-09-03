// cluster.js — run this instead of server.js in production (npm start).
import cluster from "cluster";
import os from "os";

// How many workers to fork.
//
// os.cpus().length is unreliable inside a container: it commonly reports the
// HOST machine's core count, not this instance's CPU allocation. On a small
// plan (e.g. Render Free — a fraction of one core) that forks far more workers
// than there is CPU to run them, so they fight for the scheduler and each opens
// its own MongoDB pool (MONGO_MAX_POOL_SIZE × workers connections).
//
// Resolution order:
//   1. WEB_CONCURRENCY, if set to a positive integer — always wins. Set this on
//      the host to match the plan (Render Free: 1).
//   2. os.cpus().length — reasonable for local `npm start` on a real machine.
//   3. 1 — last-resort fallback if the core count is somehow unavailable.
const parsedConcurrency = Number.parseInt(process.env.WEB_CONCURRENCY ?? "", 10);
const concurrencyFromEnv =
  Number.isInteger(parsedConcurrency) && parsedConcurrency > 0 ? parsedConcurrency : null;
const coreCount = os.cpus().length || 1;
const workerCount = concurrencyFromEnv ?? coreCount;

if (cluster.isPrimary) {
  const source = concurrencyFromEnv !== null ? "WEB_CONCURRENCY" : `os.cpus()=${coreCount}`;
  console.log(`Primary process ${process.pid} — forking ${workerCount} worker(s) (${source})`);

  // Fork the resolved number of workers
  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died — restarting`);
    cluster.fork();
  });
} else {
  // Each worker runs your Express app
  import("./server.js");
  console.log(`Worker ${process.pid} started`);
}
