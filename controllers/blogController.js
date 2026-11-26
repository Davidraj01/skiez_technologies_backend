import slugify from "slugify";
import fs from "fs";
import path from "path";
import Blog from "../models/Blog.js";
import asyncHandler from "../middleware/asyncHandler.js";

const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

const uniqueSlug = async (title, excludeId) => {
  const base = slugify(title, { lower: true, strict: true }) || "post";
  let slug = base;
  let count = 1;

  while (await Blog.findOne({ slug, _id: { $ne: excludeId } })) {
    slug = `${base}-${count++}`;
  }

  return slug;
};

// Multipart forms send arrays/objects as JSON strings; parse them safely.
const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const cleanTakeaways = (list) =>
  (Array.isArray(list) ? list : []).map((t) => String(t).trim()).filter(Boolean).slice(0, 10);

const cleanFaqs = (list) =>
  (Array.isArray(list) ? list : [])
    .map((f) => ({ question: String(f?.question || "").trim(), answer: String(f?.answer || "").trim() }))
    .filter((f) => f.question && f.answer)
    .slice(0, 20);

// Apply SEO / AEO fields from a request body onto a blog document (create or update)
const applySeoFields = (blog, body) => {
  const seo = parseJson(body.seo, null);
  if (seo && typeof seo === "object") {
    blog.seo = {
      metaTitle: String(seo.metaTitle ?? blog.seo?.metaTitle ?? "").trim(),
      metaDescription: String(seo.metaDescription ?? blog.seo?.metaDescription ?? "").trim(),
      focusKeyword: String(seo.focusKeyword ?? blog.seo?.focusKeyword ?? "").trim(),
      noindex: seo.noindex === true || seo.noindex === "true",
    };
  }
  if (body.keyTakeaways !== undefined) blog.keyTakeaways = cleanTakeaways(parseJson(body.keyTakeaways, []));
  if (body.faqs !== undefined) blog.faqs = cleanFaqs(parseJson(body.faqs, []));
};

export const getPublicBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ published: true })
    .sort({ createdAt: -1 })
    .select("-content");
  res.json(blogs);
});

export const getPublicBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, published: true });

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.json(blog);
});

export const getAllBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 }).select("-content");
  res.json(blogs);
});

export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.json(blog);
});

export const createBlog = asyncHandler(async (req, res) => {
  const { title, excerpt, content, tags, published, slug } = req.body;

  if (!title || !excerpt || !content) {
    return res.status(400).json({ message: "Title, excerpt and content are required" });
  }

  const blog = new Blog({
    title,
    excerpt,
    content,
    // A custom slug (web address) from the SEO panel wins over the title
    slug: await uniqueSlug(slug?.trim() || title),
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    published: published === undefined ? true : published === "true" || published === true,
    coverImage: req.file ? buildImageUrl(req, req.file.filename) : "",
  });
  applySeoFields(blog, req.body);
  await blog.save();

  res.status(201).json(blog);
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const { title, excerpt, content, tags, published, slug } = req.body;

  // Slug only changes when the admin edits it explicitly — changing a live URL hurts SEO
  if (slug !== undefined && slug.trim() && slugify(slug, { lower: true, strict: true }) !== blog.slug) {
    blog.slug = await uniqueSlug(slug, blog._id);
  }
  if (title) blog.title = title;

  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (content !== undefined) blog.content = content;
  if (tags !== undefined) blog.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (published !== undefined) blog.published = published === "true" || published === true;
  applySeoFields(blog, req.body);

  if (req.file) {
    if (blog.coverImage) {
      const oldFile = path.resolve("uploads", path.basename(blog.coverImage));
      fs.unlink(oldFile, () => {});
    }
    blog.coverImage = buildImageUrl(req, req.file.filename);
  }

  await blog.save();
  res.json(blog);
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.coverImage) {
    const file = path.resolve("uploads", path.basename(blog.coverImage));
    fs.unlink(file, () => {});
  }

  await blog.deleteOne();
  res.json({ message: "Blog deleted" });
});
