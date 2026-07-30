import express from "express";
import {
  getAllMessages,
  markMessageRead,
  deleteMessage,
} from "../controllers/contactController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllMessages);
router.patch("/:id/read", markMessageRead);
router.delete("/:id", deleteMessage);

export default router;
