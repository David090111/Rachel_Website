const Blog = require("../models/blog");
const slugify = require("slugify");

/** POST /api/blogs (đã verifyToken) */
const createBlog = async (req, res) => {
  const { title, content, tags, coverImageUrl, published } = req.body;
  if (!title || !content) {
    const e = new Error("Title and content are required");
    e.status = 400;
    throw e;
  }
  const slug = slugify(title, { lower: true, strict: true });
  const blog = await Blog.create({
    title,
    slug,
    content,
    tags,
    coverImageUrl,
    author: req.user._id,
    published: !!published,
    publishedAt: published ? new Date() : undefined,
  });
  res.status(201).json({ blog });
};

/** GET /api/blogs */
const listBlogs = async (req, res) => {
  const { q, tag, published } = req.query;
  const filter = {};
  if (published === "true") filter.published = true;
  if (published === "false") filter.published = false;
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };

  const blogs = await Blog.find(filter)
    .populate("author", "name email")
    .sort({ createdAt: -1 });

  res.json({ blogs });
};

/** GET /api/blogs/:slug */
const getBlog = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate(
    "author",
    "name email"
  );
  if (!blog) {
    const e = new Error("Blog not found");
    e.status = 404;
    throw e;
  }
  res.json({ blog });
};

/** PATCH /api/blogs/:slug (chỉ tác giả) */
const updateBlog = async (req, res) => {
  // 1) Tìm theo slug hiện tại
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (!blog) {
    const e = new Error("Blog not found");
    e.status = 404;
    throw e;
  }

  // 2) Kiểm quyền: tác giả hoặc admin
  const isOwner = blog.author?.toString() === req.user?._id?.toString();
  const isAdmin = req.user?.role === "admin";
  if (!isOwner && !isAdmin) {
    const e = new Error("Forbidden");
    e.status = 403;
    throw e;
  }

  // 3) Chuẩn bị dữ liệu cập nhật
  const { title, content, tags, coverImageUrl, published } = req.body;

  if (title && title !== blog.title) {
    const newSlug = slugify(title, { lower: true, strict: true });

    // Tránh đụng slug của bài khác
    const exists = await Blog.exists({ slug: newSlug, _id: { $ne: blog._id } });
    blog.slug = exists
      ? `${newSlug}-${blog._id.toString().slice(-6)}`
      : newSlug;

    blog.title = title;
  }

  if (typeof content === "string") blog.content = content;
  if (Array.isArray(tags)) blog.tags = tags;
  if (typeof coverImageUrl === "string") blog.coverImageUrl = coverImageUrl;

  if (typeof published === "boolean") {
    // set publishedAt khi chuyển từ false -> true
    if (!blog.published && published) blog.publishedAt = new Date();
    blog.published = published;
    if (!published) blog.publishedAt = undefined;
  }

  await blog.save();
  await blog.populate("author", "name email");

  res.json({ blog });
};


/** DELETE /api/blogs/:slug (chỉ tác giả) */
const deleteBlog = async (req, res) => {
  const blog = await Blog.findOneAndDelete({
    slug: req.params.slug,
    author: req.user._id,
  });
  if (!blog) {
    const e = new Error("Blog not found or forbidden");
    e.status = 404;
    throw e;
  }
  res.json({ ok: true });
};

module.exports = {
  createBlog,
  listBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
};
