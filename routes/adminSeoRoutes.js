import express from "express";
import { getAdminSettings, updateSettings } from "../controllers/seoController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/settings", getAdminSettings);
router.put("/settings", updateSettings);

export default router;
