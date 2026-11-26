import mongoose from "mongoose";

// Question/answer pair shown on the post and emitted as FAQPage structured data (AEO)
const faqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
  },
  { _id: false }
);

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

    // ---- SEO ----
    seo: {
      metaTitle: { type: String, default: "", trim: true }, // falls back to title
      metaDescription: { type: String, default: "", trim: true }, // falls back to excerpt
      focusKeyword: { type: String, default: "", trim: true },
      noindex: { type: Boolean, default: false }, // hide from search engines
    },

    // ---- AEO / GEO ----
    // Short, direct answer-style bullet points AI assistants can quote
    keyTakeaways: [{ type: String, trim: true }],
    faqs: [faqSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);
