const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    let { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    email = String(email).trim().toLowerCase();

    // Validate password
    const pass = String(password);
    const passErrors = [];
    if (pass.length < 8) passErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(pass)) passErrors.push("an uppercase letter");
    if (!/[a-z]/.test(pass)) passErrors.push("a lowercase letter");
    if (!/[0-9]/.test(pass)) passErrors.push("a number");
    if (passErrors.length) {
      return res.status(400).json({
        message: `Password must contain ${passErrors.join(", ")}`,
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // dùng create để chắc chắn chạy pre('save') hashing
    const user = await User.create({
      name: name.trim(),
      email,
      password: pass,
      role,
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};


/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      const e = new Error("email and password are required");
      e.status = 400;
      throw e;
    }
    email = String(email).trim().toLowerCase();
    password = String(password).trim();

    // QUAN TRỌNG: nếu schema có password {select:false} thì cần +password
    const user = await User.findOne({ email }).select("+password");

    // --- DEBUG: in ra để xác định lỗi ---
    console.log("[LOGIN] email:", email, "| found:", !!user);
    if (user) {
      console.log("[LOGIN] hash prefix:", String(user.password).slice(0, 7));
      console.log("[LOGIN] isHashed:", /^\$2[aby]\$/.test(user.password));
    }

    if (!user) {
      const e = new Error("Invalid credentials");
      e.status = 401;
      throw e;
    }

    const ok = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] compare result:", ok);

    if (!ok) {
      const e = new Error("Invalid credentials");
      e.status = 401;
      throw e;
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
module.exports = { register, login };
