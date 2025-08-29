const express = require("express");
const Notification = require("../models/Notification");
 const { verifyToken, isAdmin } = require("../middlewares/auth");

const router = express.Router();

function isValidUrl(str = "") {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ---- Helpers: limit & sort an toàn ----
function toSafeLimit(v, def = 50, max = 200) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

// Chỉ cho phép sort theo các field sau
const SORT_MAP = {
  newest: "-createdAt",
  oldest: "createdAt",
  pinned: "-pinned -createdAt",
  az: "title",
  za: "-title",
};
function toSafeSort(v, def = "pinned") {
  const key = String(v || "").toLowerCase();
  return SORT_MAP[key] || SORT_MAP[def] || "-pinned -createdAt";
}

/**
 * =========================
 * PUBLIC ROUTES (no auth)
 * =========================
 */

/**
 * GET /api/notifications
 * Query:
 *   q=keyword
 *   limit=number (<=200)
 *   sort= pinned|newest|oldest|az|za
 * Mặc định: chỉ trả visibility = public
 */


router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const { q = "", visibility = "", limit, sort } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { url: new RegExp(q, "i") },
        { tags: new RegExp(q, "i") },
      ];
    }
    if (visibility === "public" || visibility === "private") {
      filter.visibility = visibility;
    }
    const items = await Notification.find(filter)
      .sort(toSafeSort(sort))
      .limit(toSafeLimit(limit));

    res.json({ notifications: items });
  } catch (e) {
    console.error("GET /notifications/admin error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/notifications/admin/:id
 * Admin get one (kể cả private)
 */
router.get("/admin/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const item = await Notification.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ notification: item });
  } catch (e) {
    console.error("GET /notifications/admin/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const { q = "", limit, sort } = req.query;
    const filter = { visibility: "public" };

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { url: new RegExp(q, "i") },
        { tags: new RegExp(q, "i") },
      ];
    }

    const items = await Notification.find(filter)
      .sort(toSafeSort(sort))
      .limit(toSafeLimit(limit));

    res.json({ notifications: items });
  } catch (e) {
    console.error("GET /notifications error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/notifications/:id
 * Public: chỉ trả bản ghi visibility=public
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await Notification.findById(req.params.id);
    if (!item || item.visibility !== "public") {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ notification: item });
  } catch (e) {
    console.error("GET /notifications/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * =========================
 * ADMIN ROUTES (auth + admin)
 * =========================
 */

/**
 * GET /api/notifications/admin
 * Admin list (xem tất cả)
 * Query:
 *   q=keyword
 *   visibility=public|private (bỏ trống => tất cả)
 *   limit (<=200)
 *   sort= pinned|newest|oldest|az|za
 */


/**
 * POST /api/notifications
 * body: { title, url, description?, tags?, image?, visibility?, pinned? }
 */
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, url, description, tags, image, visibility, pinned } =
      req.body;

    if (!title || !url) {
      return res.status(400).json({ message: "Missing title/url" });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const item = await Notification.create({
      title: title.trim(),
      url: url.trim(),
      description: description?.trim() || "",
      tags: Array.isArray(tags) ? tags : [],
      image: image || "",
      visibility: visibility === "private" ? "private" : "public",
      pinned: Boolean(pinned),
    });

    res.json({ notification: item });
  } catch (e) {
    console.error("POST /notifications error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /api/notifications/:id
 */
router.patch("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.url && !isValidUrl(payload.url)) {
      return res.status(400).json({ message: "Invalid URL" });
    }
    if (
      payload.visibility &&
      !["public", "private"].includes(payload.visibility)
    ) {
      return res.status(400).json({ message: "Invalid visibility" });
    }

    const item = await Notification.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!item) return res.status(404).json({ message: "Not found" });

    res.json({ notification: item });
  } catch (e) {
    console.error("PATCH /notifications/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/notifications/:id
 */
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const item = await Notification.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /notifications/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * (Optional) POST /api/notifications/:id/click
 * Đếm click (public)
 */
router.post("/:id/click", async (req, res) => {
  try {
    const item = await Notification.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!item || item.visibility !== "public") {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ ok: true, clicks: item.clicks });
  } catch (e) {
    console.error("POST /notifications/:id/click error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
