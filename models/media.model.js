const mongoose = require("mongoose");

const mediaItemSchema = new mongoose.Schema(
  {
    path: {
      type: String, // uploads/filename.jpg or mp4
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { timestamps: true } // optional: createdAt for each file
);

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },

    media: [mediaItemSchema], // 👈 single array with unique IDs
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);
