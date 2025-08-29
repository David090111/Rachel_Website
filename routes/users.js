const express = require("express");
const { verifyToken, isAdmin } = require("../middlewares/auth");
const { me, listUsers } = require("../controllers/user");

const router = express.Router();

// Thông tin user hiện tại
router.get("/me", verifyToken, me);

// Danh sách user (admin)
router.get("/", verifyToken, isAdmin, listUsers);

module.exports = router;
