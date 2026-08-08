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
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error", format: fileFormat }),
    new winston.transports.File({ filename: path.join(logsDir, "combined.log"), format: fileFormat }),
  ],
  exitOnError: false,
});

// morgan writes one line per request via this stream, landing in combined.log too
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};
