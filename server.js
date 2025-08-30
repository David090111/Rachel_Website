const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const morgan=require('morgan');

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const blogRoutes = require("./routes/blog");
const commentRoutes = require("./routes/comments");



dotenv.config();
const connectDB=require('./config/db');





const app = express();
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://rachel-website-frontend.vercel.app", // prod FE
  // thêm custom domain nếu có: "https://yourdomain.com",
]);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // healthcheck, curl, uptime
    try {
      const u = new URL(origin);
      const ok =
        allowedOrigins.has(origin) ||
        // cho preview của chính project này (tuỳ bạn giữ/ bỏ)
        u.hostname.endsWith(".vercel.app");
      return ok ? cb(null, true) : cb(new Error("Not allowed by CORS"));
    } catch {
      return cb(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET","POST","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.options("*", cors()); // preflight

 app.use(express.json());
    
 app.use(morgan('dev'));


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", require("./routes/notifications"));

app.get("/healthz", (req, res) => {
  // Có thể check DB nhẹ nhàng nếu muốn:
  // const dbOk = mongoose.connection.readyState === 1;
  // if (!dbOk) return res.status(503).send("db not ready");
  res.status(200).send("ok");
});





app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
const PORT=process.env.PORT || 5000;
app.listen(PORT, async()=>{
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});