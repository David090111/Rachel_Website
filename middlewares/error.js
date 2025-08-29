// Middleware xử lý lỗi tập trung
const errorHandler = (err, _req, res, _next) => {
  console.error("Error:", err.message);

  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
};

module.exports = { errorHandler };
