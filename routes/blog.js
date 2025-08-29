const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const {
  createBlog,
  listBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blog");

const router = express.Router();

// Public: list + detail
router.get("/", listBlogs);
router.get("/:slug", getBlog);

// Private: CRUD (cần đăng nhập)
router.post("/", verifyToken, createBlog);
router.patch("/:slug", verifyToken, updateBlog);
router.delete("/:slug", verifyToken, deleteBlog);

module.exports = router;
