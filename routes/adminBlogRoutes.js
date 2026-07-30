import express from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.post("/", upload.single("coverImage"), createBlog);
router.put("/:id", upload.single("coverImage"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
