const Media = require("../models/media.model");
const Playlist = require("../models/playlist.model");
module.exports = {
uploadMedia : async (req, res) => {
  try {
    const { title, description } = req.body;

    const images = [];
    const videos = [];

    if (req.files) {
      req.files.forEach((file) => {
        if (file.mimetype.startsWith("image")) {
          images.push(file.path);
        } else if (file.mimetype.startsWith("video")) {
          videos.push(file.path);
        }
      });
    }

    const media = new Media({
      title,
      description,
      images,
      videos,
    });

    await media.save();

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: media,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Media upload failed",
    });
  }
},

getAllMedia : async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch media" });
  }
},

  // ================= CREATE PLAYLIST =================
  createPlaylist: async (req, res) => {
    try {
      const { name, description, mediaIds } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Playlist name is required" });
      }

      // Validate media IDs
      if (mediaIds && mediaIds.length > 0) {
        const count = await Media.countDocuments({ _id: { $in: mediaIds } });
        if (count !== mediaIds.length) {
          return res.status(400).json({ error: "Invalid media IDs provided" });
        }
      }

      const playlist = new Playlist({
        name,
        description,
        mediaItems: mediaIds || [],
      });

      await playlist.save();

      res.status(201).json({
        success: true,
        message: "Playlist created successfully",
        data: playlist,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to create playlist" });
    }
  },

  // ================= ADD MEDIA TO PLAYLIST =================
  addMediaToPlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { mediaId } = req.body;

      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (!playlist.mediaItems.includes(mediaId)) {
        playlist.mediaItems.push(mediaId);
        await playlist.save();
      }

      res.json({
        success: true,
        message: "Media added to playlist",
        data: playlist,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to add media to playlist" });
    }
  },

  // ================= GET PLAYLIST WITH MEDIA =================
  getPlaylistById: async (req, res) => {
    try {
      const playlist = await Playlist.findById(req.params.id)
        .populate("mediaItems");

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      res.json({
        success: true,
        data: playlist,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  },

  // ================= GET ALL PLAYLISTS =================
  getAllPlaylists: async (req, res) => {
    try {
      const playlists = await Playlist.find()
        .sort({ createdAt: -1 })
        .populate("mediaItems");

      res.json({
        success: true,
        count: playlists.length,
        data: playlists,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  },
};
