import slugify from "slugify";
import fs from "fs";
import path from "path";
import Blog from "../models/Blog.js";
import asyncHandler from "../middleware/asyncHandler.js";

const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

const uniqueSlug = async (title, excludeId) => {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let count = 1;

  while (await Blog.findOne({ slug, _id: { $ne: excludeId } })) {
    slug = `${base}-${count++}`;
  }

  return slug;
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
  const { title, excerpt, content, tags, published } = req.body;

  if (!title || !excerpt || !content) {
    return res.status(400).json({ message: "Title, excerpt and content are required" });
  }

  const blog = await Blog.create({
    title,
    excerpt,
    content,
    slug: await uniqueSlug(title),
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    published: published === undefined ? true : published === "true" || published === true,
    coverImage: req.file ? buildImageUrl(req, req.file.filename) : "",
  });

  res.status(201).json(blog);
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const { title, excerpt, content, tags, published } = req.body;

  if (title && title !== blog.title) {
    blog.slug = await uniqueSlug(title, blog._id);
    blog.title = title;
  }

  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (content !== undefined) blog.content = content;
  if (tags !== undefined) blog.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (published !== undefined) blog.published = published === "true" || published === true;

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
