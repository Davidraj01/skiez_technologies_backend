import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    console.log(`Admin already exists: ${existing.email}`);
  } else {
    const admin = await Admin.create({
      name: ADMIN_NAME || "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    console.log(`Admin created: ${admin.email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
