const router = require("express").Router();
const upload = require("../Helpers/multer");
const controller = require("../controllers/media.controller");
const { verifyAccessToken } = require("../Helpers/jwt_helper");

/* ================= MEDIA ================= */

// Upload media (user-specific)
router.post(
  "/upload",
  verifyAccessToken,                // 🔐 protect
  upload.array("files", 15),
  controller.uploadMedia
);

// Get logged-in user's media only
router.get(
  "/",
  verifyAccessToken,                // 🔐 protect
  controller.getAllMedia
);

router.delete(
  "/:mediaId/item/:mediaItemId",
  verifyAccessToken,
  controller.deleteMediaItem
);

/* ================= PLAYLIST ================= */

// Create playlist (user-specific)
router.post(
  "/playlist",
  verifyAccessToken,                // 🔐 protect
  controller.createPlaylist
);

// Add media to playlist (owner check inside controller)
router.post(
  "/playlist/:playlistId/add",
  verifyAccessToken,                // 🔐 protect
  controller.addMediaToPlaylist
);

// Get single playlist (must belong to user)
router.get(
  "/playlist/:id",
  verifyAccessToken,                // 🔐 protect
  controller.getPlaylistById
);

// Get all playlists of logged-in user
router.get(
  "/playlists",
  verifyAccessToken,                // 🔐 protect
  controller.getAllPlaylists
);

router.put("/playlist/:playlistId", verifyAccessToken, controller.updatePlaylist);
router.delete("/playlist/:playlistId", verifyAccessToken, controller.deletePlaylist);


module.exports = router;
