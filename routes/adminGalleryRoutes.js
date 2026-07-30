import express from "express";
import {
  getAllGalleryImages,
  createGalleryImage,
  deleteGalleryImage,
} from "../controllers/galleryController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllGalleryImages);
router.post("/", upload.single("image"), createGalleryImage);
router.delete("/:id", deleteGalleryImage);

export default router;
