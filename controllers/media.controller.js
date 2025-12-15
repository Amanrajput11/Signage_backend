const Media = require("../models/media.model");
const Playlist = require("../models/playlist.model");

module.exports = {
  
uploadMedia: async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { title, description } = req.body;
    const userId = req.user._id; // ✅ THIS IS THE FIX

    const mediaFiles = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        mediaFiles.push({
          path: file.path,
          type: file.mimetype.startsWith("image") ? "image" : "video",
        });
      });
    }

    const media = new Media({
      title,
      description,
      media: mediaFiles,
      uploadedBy: userId, // 🔥 REQUIRED FIELD
    });

    await media.save();

    res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: media,
    });
  } catch (err) {
    console.error("UPLOAD MEDIA ERROR 👉", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
},



getAllMedia: async (req, res) => {
  try {
    const userId = req.user._id; // ✅ FIXED

    const mediaList = await Media.find({ uploadedBy: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: mediaList.length,
      data: mediaList,
    });
  } catch (err) {
    console.error("GET MEDIA ERROR 👉", err);
    res.status(500).json({ error: "Failed to fetch media" });
  }
},




  // ================= CREATE PLAYLIST =================
createPlaylist: async (req, res) => {
  try {
    const { name, description, mediaItems } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    // 🔐 Validate media ownership
    if (mediaItems?.length) {
      for (const item of mediaItems) {
        const media = await Media.findOne({
          _id: item.mediaId,
          uploadedBy: userId, // 🔥 critical
        });

        if (!media) {
          return res
            .status(403)
            .json({ error: "Unauthorized media access" });
        }

        const exists = media.media.some(
          (m) => m._id.toString() === item.mediaItemId
        );

        if (!exists) {
          return res.status(400).json({ error: "Invalid mediaItemId" });
        }
      }
    }

    const playlist = new Playlist({
      name,
      description,
      mediaItems: mediaItems || [],
      createdBy: userId,
    });

    await playlist.save();

    res.status(201).json({
      success: true,
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
    const { mediaId, mediaItemId, type } = req.body;
    const userId = req.user._id;

    if (!mediaId || !mediaItemId || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔐 Playlist owner check
    const playlist = await Playlist.findOne({
      _id: playlistId,
      createdBy: userId,
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // 🔐 Media owner check
    const media = await Media.findOne({
      _id: mediaId,
      uploadedBy: userId,
    });

    if (!media) {
      return res.status(403).json({ error: "Unauthorized media" });
    }

    // ✅ Validate mediaItem exists
    const exists = media.media.some(
      (m) => m._id.toString() === mediaItemId.toString()
    );

    if (!exists) {
      return res.status(400).json({ error: "Invalid mediaItemId" });
    }

    // 🚫 Prevent duplicate add
    const alreadyAdded = playlist.mediaItems.some(
      (i) => i.mediaItemId.toString() === mediaItemId.toString()
    );

    if (!alreadyAdded) {
      playlist.mediaItems.push({ mediaId, mediaItemId, type });
      await playlist.save();
    }

    res.json({
      success: true,
      message: alreadyAdded
        ? "Media already exists in playlist"
        : "Media added to playlist",
      data: playlist,
    });
  } catch (err) {
    console.error("ADD MEDIA TO PLAYLIST ERROR 👉", err);
    res.status(500).json({ error: "Failed to add media" });
  }
},



  // ================= GET PLAYLIST WITH MEDIA =================
  getPlaylistById: async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("mediaItems.mediaId");

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const formatted = playlist.mediaItems.map((item) => {
      const mediaDoc = item.mediaId;
      const mediaFile = mediaDoc.media.find(
        (m) => m._id.toString() === item.mediaItemId.toString()
      );

      return {
        _id: item._id,
        type: item.type,
        path: mediaFile?.path,
        mediaItemId: item.mediaItemId,
      };
    });

    res.json({
      success: true,
      data: {
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        mediaItems: formatted,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
},


  // ================= GET ALL PLAYLISTS =================
  getAllPlaylists: async (req, res) => {
  try {
    const userId = req.user._id;

    const playlists = await Playlist.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate("mediaItems.mediaId");

    res.json({
      success: true,
      count: playlists.length,
      data: playlists,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
},


};
