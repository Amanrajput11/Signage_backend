const Media = require("../models/media.model");
const Playlist = require("../models/playlist.model");
const { exec } = require("child_process");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const FFMPEG_PATH = "C:\\ffmpeg\\bin\\ffmpeg.exe";

const toPublicPath = (filePath) => {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
};

const ensureExtension = (filePath, mimetype) => {
  const ext = path.extname(filePath);

  if (ext) return filePath;

  let newExt = ".mp4";
  if (mimetype.startsWith("image")) {
    newExt = ".jpg";
  }

  const newPath = filePath + newExt;
  fs.renameSync(filePath, newPath);

  return newPath;
};

const rotateVideo = (inputPath) => {
  return new Promise((resolve, reject) => {
    const absInput = path.resolve(inputPath);
    const ext = path.extname(absInput) || ".mp4";
    const absOutput = absInput.replace(ext, `_rotated${ext}`);

    console.log("INPUT:", absInput);
    console.log("OUTPUT:", absOutput);
    console.log("FFMPEG:", FFMPEG_PATH);

    const ffmpeg = spawn(FFMPEG_PATH, [
      "-y",
      "-i",
      absInput,
      "-vf",
      "transpose=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      absOutput,
    ]);

    ffmpeg.stderr.on("data", (data) => {
      console.log("FFMPEG:", data.toString());
    });

    ffmpeg.on("error", (err) => {
      console.error("SPAWN ERROR:", err);
      reject(new Error("FFmpeg spawn failed"));
    });

    ffmpeg.on("close", (code) => {
      console.log("FFMPEG EXIT CODE:", code);

      if (code !== 0 || !fs.existsSync(absOutput)) {
        return reject(new Error("Rotated video file not created"));
      }

      resolve(absOutput);
    });
  });
};
module.exports = {
  uploadMedia: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { title, description, playlistName, orientation } = req.body;
      const userId = req.user._id;

      const mediaFiles = [];

      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          const fixedPath = ensureExtension(file.path, file.mimetype);

          if (file.mimetype.startsWith("video")) {
            if (orientation === "vertical") {
              const rotatedPath = await rotateVideo(fixedPath);

              mediaFiles.push({
                path: toPublicPath(rotatedPath),
                type: "video",
              });
            } else {
              mediaFiles.push({
                path: toPublicPath(fixedPath),
                type: "video",
              });
            }
          } else {
            mediaFiles.push({
              path: toPublicPath(fixedPath),
              type: "image",
            });
          }
        }
      }

      const media = new Media({
  title,
  description,
  orientation: orientation || "horizontal",
  media: mediaFiles,
  uploadedBy: userId,
});


      await media.save();

      const playlistMediaItems = media.media.map((item) => ({
        mediaId: media._id,
        mediaItemId: item._id,
        type: item.type,
      }));

      const playlist = new Playlist({
        name: playlistName || `Playlist - ${new Date().toLocaleString()}`,
        description: `Auto playlist for ${title || "media upload"}`,
        orientation: orientation || "horizontal",
        mediaItems: playlistMediaItems,
        createdBy: userId,
        isActive: true,
      });

      await Playlist.updateMany(
        { createdBy: userId },
        { $set: { isActive: false } }
      );

      await playlist.save();

      res.status(201).json({
        success: true,
        message: "Media uploaded and playlist created successfully",
        data: {
          media,
          playlist,
        },
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
      const userId = req.user._id;

      const mediaList = await Media.find({ uploadedBy: userId }).sort({
        createdAt: -1,
      });

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

  createPlaylist: async (req, res) => {
    try {
      const { name, description, mediaItems, orientation } = req.body;
      const userId = req.user._id;

      if (!name) {
        return res.status(400).json({ error: "Playlist name is required" });
      }

      const allowedOrientations = ["vertical", "horizontal"];
      if (orientation && !allowedOrientations.includes(orientation)) {
        return res.status(400).json({ error: "Invalid orientation" });
      }

      if (mediaItems?.length) {
        for (const item of mediaItems) {
          const media = await Media.findOne({
            _id: item.mediaId,
            uploadedBy: userId,
          });

          if (!media) {
            return res.status(403).json({ error: "Unauthorized media access" });
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
        orientation: orientation || "horizontal",
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

  addMediaToPlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { mediaId, mediaItemId, type } = req.body;
      const userId = req.user._id;

      if (!mediaId || !mediaItemId || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const playlist = await Playlist.findOne({
        _id: playlistId,
        createdBy: userId,
      });

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      const media = await Media.findOne({
        _id: mediaId,
        uploadedBy: userId,
      });

      if (!media) {
        return res.status(403).json({ error: "Unauthorized media" });
      }
// ❌ Orientation mismatch check
if (playlist.orientation !== media.orientation) {
  return res.status(400).json({
    success: false,
    error: `Cannot add ${media.orientation} media to a ${playlist.orientation} playlist`,
  });
}

      const exists = media.media.some(
        (m) => m._id.toString() === mediaItemId.toString()
      );

      if (!exists) {
        return res.status(400).json({ error: "Invalid mediaItemId" });
      }

    const alreadyAdded = playlist.mediaItems.some(
  (i) => i.mediaItemId.toString() === mediaItemId.toString()
);

if (alreadyAdded) {
  return res.status(409).json({
    success: false,
    error: "This media already exists in the playlist",
  });
}

playlist.mediaItems.push({ mediaId, mediaItemId, type });
await playlist.save();

res.json({
  success: true,
  message: "Media added to playlist",
  data: playlist,
});

    } catch (err) {
      console.error("ADD MEDIA TO PLAYLIST ERROR 👉", err);
      res.status(500).json({ error: "Failed to add media" });
    }
  },

  getPlaylistById: async (req, res) => {
    try {
      const playlist = await Playlist.findById(req.params.id).populate(
        "mediaItems.mediaId"
      );

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
          mediaId: mediaDoc._id,
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
  updatePlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { name, description, mediaItems } = req.body;
      const userId = req.user._id;

      const playlist = await Playlist.findOne({
        _id: playlistId,
        createdBy: userId,
      });

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (name !== undefined) playlist.name = name;
      if (description !== undefined) playlist.description = description;

      if (Array.isArray(mediaItems)) {
        for (const item of mediaItems) {
          const { mediaId, mediaItemId, type } = item;

          if (!mediaId || !mediaItemId || !type) {
            return res.status(400).json({ error: "Invalid media item data" });
          }

          const media = await Media.findOne({
            _id: mediaId,
            uploadedBy: userId,
          });

          if (!media) {
            return res.status(403).json({ error: "Unauthorized media access" });
          }

          const exists = media.media.some(
            (m) => m._id.toString() === mediaItemId.toString()
          );

          if (!exists) {
            return res.status(400).json({ error: "Invalid mediaItemId" });
          }
        }

        playlist.mediaItems = mediaItems;
      }

      await playlist.save();

      res.json({
        success: true,
        message: "Playlist updated successfully",
        data: playlist,
      });
    } catch (err) {
      console.error("UPDATE PLAYLIST ERROR 👉", err);
      res.status(500).json({ error: "Failed to update playlist" });
    }
  },

  deletePlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const userId = req.user._id;

      const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        createdBy: userId,
      });

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      res.json({
        success: true,
        message: "Playlist deleted successfully",
      });
    } catch (err) {
      console.error("DELETE PLAYLIST ERROR 👉", err);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  },

  deleteMediaItem: async (req, res) => {
    try {
      const { mediaId, mediaItemId } = req.params;
      const userId = req.user._id;

      const media = await Media.findOne({
        _id: mediaId,
        uploadedBy: userId,
      });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: "Media not found or unauthorized",
        });
      }

      const itemExists = media.media.some(
        (m) => m._id.toString() === mediaItemId
      );

      if (!itemExists) {
        return res.status(404).json({
          success: false,
          error: "Media item not found",
        });
      }

      media.media = media.media.filter((m) => m._id.toString() !== mediaItemId);

      await media.save();

      await Playlist.updateMany(
        {},
        {
          $pull: {
            mediaItems: {
              mediaId: mediaId,
              mediaItemId: mediaItemId,
            },
          },
        }
      );

      if (media.media.length === 0) {
        await Media.findByIdAndDelete(mediaId);
      }

      res.json({
        success: true,
        message: "Media item deleted successfully",
      });
    } catch (err) {
      console.error("DELETE MEDIA ITEM ERROR 👉", err);
      res.status(500).json({
        success: false,
        error: "Failed to delete media item",
      });
    }
  },
  activatePlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const userId = req.user._id;

      const playlist = await Playlist.findOne({
        _id: playlistId,
        createdBy: userId,
      });

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      await Playlist.updateMany(
        { createdBy: userId },
        { $set: { isActive: false } }
      );

      playlist.isActive = true;
      await playlist.save();

      res.json({
        success: true,
        message: "Playlist activated successfully",
        data: playlist,
      });
    } catch (err) {
      console.error("ACTIVATE PLAYLIST ERROR 👉", err);
      res.status(500).json({ error: "Failed to activate playlist" });
    }
  },
  deactivatePlaylist: async (req, res) => {
    try {
      const { playlistId } = req.params;
      const userId = req.user._id;

      const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, createdBy: userId },
        { isActive: false },
        { new: true }
      );

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      res.json({
        success: true,
        message: "Playlist deactivated",
        data: playlist,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to deactivate playlist" });
    }
  },
};
