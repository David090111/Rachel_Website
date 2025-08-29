const mongoose = require('mongoose');
const blog = require('./blog');

const commentSchema = new mongoose.Schema(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // optional
    authorName: { type: String, required: true, trim: true, maxlength: 120 }, // 👈 thêm
    content: { type: String, required: true, trim: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);