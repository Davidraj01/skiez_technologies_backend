import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import asyncHandler from "../middleware/asyncHandler.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: generateToken(admin._id),
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.admin);
});
