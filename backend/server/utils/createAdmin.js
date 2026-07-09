import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
      return;
    }

    const exists = await Admin.findOne({ email: adminEmail.toLowerCase() });

    if (exists) {
      const matches = await bcrypt.compare(adminPassword, exists.password);
      if (!matches) {
        exists.password = await bcrypt.hash(adminPassword, 10);
        await exists.save();
        console.log("✅ Admin password synced with .env");
      } else {
        console.log("✅ Admin already exists and password matches .env");
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await Admin.create({
      name: "Tanmay Admin",
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
    });

    console.log("✅ Default Admin Created");
  } catch (err) {
    console.error("Create Admin Error:", err.message);
  }
};
