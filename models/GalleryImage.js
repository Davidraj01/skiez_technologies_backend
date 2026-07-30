import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, default: "" },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryImage", galleryImageSchema);
