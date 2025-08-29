const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000 },

    // tuỳ chọn
    tags: [{ type: String, trim: true }],
    image: { type: String, trim: true }, // thumbnail/og image nếu muốn
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    pinned: { type: Boolean, default: false }, // ghim lên đầu
    clicks: { type: Number, default: 0 }, // đếm click (nếu dùng)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
