import mongoose from "mongoose";
import { getRequiredDbConfig } from "./config";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function getMongoUri(): string {
  return getRequiredDbConfig().mongoUri;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    const config = getRequiredDbConfig();

    connectionPromise = mongoose
      .connect(config.mongoUri, {
        dbName: config.dbName,
      })
      .then(() => mongoose);
  }

  return connectionPromise;
}

export async function disconnectDb(): Promise<void> {
  connectionPromise = null;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
