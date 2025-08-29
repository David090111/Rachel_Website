const User = require("../models/user");

/** GET /api/users/me (đã verifyToken) */
const me = async (req, res) => {
  res.json({ user: req.user });
};

/** GET /api/users (admin only) */
const listUsers = async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ users });
};

module.exports = { me, listUsers };
