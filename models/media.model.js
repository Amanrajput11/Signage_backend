const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },

    images: [
      {
        type: String, // uploads/filename.jpg
      },
    ],
    videos: [
      {
        type: String, // uploads/filename.mp4
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);
