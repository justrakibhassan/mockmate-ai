import mongoose from "mongoose";
import dns from "dns";

function configureDNS() {
  // Public DNS fallback is for local Windows development resolution; prod cloud environments should use VPC DNS
  if (process.env.NODE_ENV !== "production" && dns && typeof dns.setServers === "function") {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (err) {
      console.warn("Failed to set public DNS fallback servers:", err);
    }
  }
  if (dns && typeof dns.setDefaultResultOrder === "function") {
    try {
      dns.setDefaultResultOrder("ipv4first");
    } catch {
      // ignore
    }
  }
}

// Initial DNS configuration on module load
configureDNS();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Reinforce DNS fallback before attempting connection
  configureDNS();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
