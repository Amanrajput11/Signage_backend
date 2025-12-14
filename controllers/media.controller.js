const Media = require("../models/media.model");
const Playlist = require("../models/playlist.model");
module.exports = {
uploadMedia: async (req, res) => {
  try {
    const { title, description } = req.body;

    const mediaFiles = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.mimetype.startsWith("image")) {
          mediaFiles.push({
            path: file.path,
            type: "image",
          });
        } else if (file.mimetype.startsWith("video")) {
          mediaFiles.push({
            path: file.path,
            type: "video",
          });
        }
      });
    }

    const media = new Media({
      title,
      description,
      media: mediaFiles,
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

getAllMedia: async (req, res) => {
  try {
    const mediaList = await Media.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: mediaList.length,
      data: mediaList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch media",
    });
  }
},


  // ================= CREATE PLAYLIST =================
createPlaylist: async (req, res) => {
  try {
    const { name, description, mediaItems } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    // Validate media items
    if (mediaItems?.length) {
      for (const item of mediaItems) {
        const media = await Media.findById(item.mediaId);
        if (!media) {
          return res.status(400).json({ error: "Invalid mediaId" });
        }

        const exists = media.media.some(
          (m) => m._id.toString() === item.mediaItemId
        );

        if (!exists) {
          return res
            .status(400)
            .json({ error: "Invalid mediaItemId" });
        }
      }
    }

    const playlist = new Playlist({
      name,
      description,
      mediaItems: mediaItems || [],
    });

    await playlist.save();

    res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      data: playlist,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create playlist" });
  }
},


  // ================= ADD MEDIA TO PLAYLIST =================
  addMediaToPlaylist: async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { mediaId, mediaItemId, type } = req.body;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return res.status(400).json({ error: "Invalid mediaId" });
    }

    const exists = media.media.some(
      (m) => m._id.toString() === mediaItemId
    );

    if (!exists) {
      return res.status(400).json({ error: "Invalid mediaItemId" });
    }

    const alreadyAdded = playlist.mediaItems.some(
      (i) => i.mediaItemId.toString() === mediaItemId
    );

    if (!alreadyAdded) {
      playlist.mediaItems.push({ mediaId, mediaItemId, type });
      await playlist.save();
    }

    res.json({
      success: true,
      message: "Media item added to playlist",
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
    const playlists = await Playlist.find()
      .sort({ createdAt: -1 })
      .populate("mediaItems.mediaId");

    const result = playlists.map((playlist) => ({
      _id: playlist._id,
      name: playlist.name,
      description: playlist.description,
      createdAt: playlist.createdAt,
      mediaItems: playlist.mediaItems.map((item) => {
        const mediaFile = item.mediaId.media.find(
          (m) => m._id.toString() === item.mediaItemId.toString()
        );

        return {
          _id: item._id,
          type: item.type,
          path: mediaFile?.path,
        };
      }),
    }));

    res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
},

};
