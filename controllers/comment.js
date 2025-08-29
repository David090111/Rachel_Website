// controllers/comments.controller.js
const mongoose = require("mongoose");
const Comment = require("../models/comment");

/** POST /api/comments  (đã verifyToken) */
const createComment = async (req, res, next) => {
  try {
    const { blogId, content, parent } = req.body;

    if (!blogId || !String(content || "").trim()) {
      return res
        .status(400)
        .json({ message: "blogId and content are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: "Invalid blogId" });
    }
    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({ message: "Invalid parent id" });
    }

    const doc = {
      blog: blogId,
      author: req.user._id,
      // Nếu schema yêu cầu authorName, dòng dưới đảm bảo không lỗi:
      authorName: req.user.name || req.user.email || "Anonymous",
      content: String(content).trim(),
      parent: parent || null,
    };

    const cmt = await Comment.create(doc);
    // populate để FE hiển thị tên ngay
    const populated = await cmt.populate("author", "name email");

    return res.status(201).json({ comment: populated });
  } catch (e) {
    next(e);
  }
};

/** GET /api/comments/by-blog/:blogId */
const listCommentsByBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.json({ comments: [] });
    }

    const comments = await Comment.find({ blog: blogId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return res.json({ comments });
  } catch (e) {
    next(e);
  }
};

/** DELETE /api/comments/:id (chỉ tác giả) */
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const cmt = await Comment.findOneAndDelete({
      _id: id,
      author: req.user._id,
    });
    if (!cmt) {
      return res
        .status(404)
        .json({ message: "Comment not found or forbidden" });
    }
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/** PATCH /api/comments/:id (chỉ tác giả) */
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!String(content || "").trim()) {
      return res.status(400).json({ message: "content is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const update = {
      content: String(content).trim(),
      // nếu schema có 2 field dưới, bạn hãy thêm vào schema; nếu không có, bỏ chúng đi
      edited: true,
      editedAt: new Date(),
    };

    const cmt = await Comment.findOneAndUpdate(
      { _id: id, author: req.user._id },
      { $set: update },
      { new: true, runValidators: true }
    ).populate("author", "name email");

    if (!cmt) {
      return res
        .status(404)
        .json({ message: "Comment not found or forbidden" });
    }

    return res.json({ comment: cmt });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createComment,
  listCommentsByBlog,
  deleteComment,
  updateComment,
};
