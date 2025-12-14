const mongoose = require("mongoose");

const playlistItemSchema = new mongoose.Schema(
  {
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      required: true,
    },

    mediaItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // _id of image/video inside Media
    },

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { _id: true }
);

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    mediaItems: [playlistItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Playlist", playlistSchema);
