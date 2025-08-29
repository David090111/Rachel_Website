// routes/comments.routes.js
const express = require("express");
const { verifyToken } = require("../middlewares/auth"); // <— kiểm tra: 'middleware' hay 'middlewares'
const {
  createComment,
  listCommentsByBlog,
  deleteComment,
  updateComment,
} = require("../controllers/comment"); // <— khớp đúng tên file controller

const router = express.Router();

/**
 * GET /api/comments/by-blog/:blogId
 * Public: lấy danh sách comment theo blog
 */
router.get("/by-blog/:blogId", listCommentsByBlog);

/**
 * POST /api/comments
 * Private: tạo comment (yêu cầu đăng nhập)
 *  - Controller đã tự gắn author = req.user._id và authorName = req.user.name
 */
router.post("/", verifyToken, createComment);

/**
 * PATCH /api/comments/:id
 * Private: chỉ tác giả được phép sửa nội dung bình luận
 */
router.patch("/:id", verifyToken, updateComment);

/**
 * DELETE /api/comments/:id
 * Private: chỉ tác giả được phép xóa bình luận
 */
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;
