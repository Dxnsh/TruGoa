// cluster.js — run this instead of server.js in production
import cluster from "cluster";
import os from "os";

const cpus = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} — forking ${cpus} workers`);

  // Fork one worker per CPU core
  for (let i = 0; i < cpus; i++) {
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