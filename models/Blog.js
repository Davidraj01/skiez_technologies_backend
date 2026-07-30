import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    tags: [{ type: String }],
    author: { type: String, default: "Skiez Technologies" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
