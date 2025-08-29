const express = require("express");
const { register, login } = require("../controllers/auth");

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

module.exports = router;
