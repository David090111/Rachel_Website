const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    coverImageUrl: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String, trim: true }],
    published: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

// Tạo text index để search theo title/content/tags
blogSchema.index({ title: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Blog", blogSchema);
