import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    // In cluster mode (see cluster.js) every CPU-core worker opens its own
    // pool, so the real ceiling on concurrent DB connections is
    // maxPoolSize × workers, not just maxPoolSize — keep the per-worker
    // pool modest by default and let deployments size it via env.
    const maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE) || 8;
    const minPoolSize = Number(process.env.MONGO_MIN_POOL_SIZE) || 2;

    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS: 30000, // recycle idle connections — Atlas shared tiers can drop long-idle sockets
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB Connected (pool: ${minPoolSize}-${maxPoolSize})`);
    mongoose.connection.on("disconnected", () =>
      logger.error("MongoDB disconnected")
    );
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;