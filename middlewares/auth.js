const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verifyToken = async (req, res, next) => {
  try {
    // ✅ Cho phép preflight qua
    if (req.method === "OPTIONS") return next();

    // Lấy Authorization (case-insensitive và để ý "Bearer"/"bearer")
    const header = req.headers.authorization || "";
    const prefix = header.slice(0, 7).toLowerCase(); // "bearer "
    const token = prefix === "bearer " ? header.slice(7) : null;

    if (!token) {
      return res
        .status(401)
        .json({ error: true, message: "No token provided" });
    }

    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        return res.status(401).json({ error: true, message: "Token expired" });
      }
      return res.status(401).json({ error: true, message: "Invalid token" });
    }

    // Tìm user
    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: true, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: true, message: "Unauthorized" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: true, message: "Forbidden: Admin only" });
  }
  next();
};

module.exports = { verifyToken, isAdmin };
