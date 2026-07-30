import fs from "fs";
import path from "path";
import GalleryImage from "../models/GalleryImage.js";
import asyncHandler from "../middleware/asyncHandler.js";

const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

export const getPublicGallery = asyncHandler(async (req, res) => {
  const images = await GalleryImage.find().sort({ createdAt: -1 });
  res.json(images);
});

export const getAllGalleryImages = asyncHandler(async (req, res) => {
  const images = await GalleryImage.find().sort({ createdAt: -1 });
  res.json(images);
});

export const createGalleryImage = asyncHandler(async (req, res) => {
  const { title, caption } = req.body;

  if (!title || !req.file) {
    return res.status(400).json({ message: "Title and image are required" });
  }

  const image = await GalleryImage.create({
    title,
    caption: caption || "",
    imageUrl: buildImageUrl(req, req.file.filename),
  });

  res.status(201).json(image);
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findById(req.params.id);

  if (!image) {
    return res.status(404).json({ message: "Image not found" });
  }

  const file = path.resolve("uploads", path.basename(image.imageUrl));
  fs.unlink(file, () => {});

  await image.deleteOne();
  res.json({ message: "Image deleted" });
});
