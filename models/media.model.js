const mongoose = require("mongoose");

const MediaItemSchema = new mongoose.Schema({
  path: String,
  type: { type: String, enum: ["image", "video"] }
});

const MediaSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    media: [MediaItemSchema],

    // 🔐 OWNER
    uploadedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
}

  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
