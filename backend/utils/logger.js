// utils/logger.js
import winston from "winston";
import path from "path";
import fs from "fs";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${stack || message}`)
);

const fileFormat = combine(timestamp(), errors({ stack: true }), winston.format.json());

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels: winston.config.npm.levels,
  transports: [
    // The platform captures stdout, so the console transport is the one that
    // matters in production. The files stay for local work and as a fallback,
    // now capped so they cannot grow without bound on a long-lived host.
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5_000_000,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
      maxsize: 5_000_000,
      maxFiles: 3,
    }),
  ],
  exitOnError: false,
});

// Morgan writes one line per request through this stream.
//
// It used to call logger.http(). In winston's npm levels http is 3 and info is
// 2, and the logger runs at "info" outside development — so every request line
// was filtered out in production and the access log was simply empty. Logging
// at info means the requests actually reach stdout, which is what the host
// collects.
export const morganStream = {
  write: (message) => logger.info(message.trim()),
};
