import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;

const r1 = await db.collection("users").deleteMany({ email: { $regex: /^probe-|^e2e-/ } });
console.log("users removed:", r1.deletedCount);

mongoose.disconnect().catch(() => {});

