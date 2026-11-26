import express from "express";
import { getPublicSettings, sitemapXml, robotsTxt, llmsTxt } from "../controllers/seoController.js";

const router = express.Router();

router.get("/settings", getPublicSettings);
router.get("/sitemap.xml", sitemapXml);
router.get("/robots.txt", robotsTxt);
router.get("/llms.txt", llmsTxt);

export default router;
