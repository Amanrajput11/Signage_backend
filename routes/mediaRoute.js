const router = require("express").Router();
const upload = require("../Helpers/multer");
const controller = require("../controllers/media.controller");

// Upload multiple images & videos together
router.post(
  "/upload",
  upload.array("files", 15), // images + videos together
  controller.uploadMedia
);
// Get all uploaded media
router.get("/", controller.getAllMedia);

// Playlist
router.post("/playlist", controller.createPlaylist);
router.post("/playlist/:playlistId/add", controller.addMediaToPlaylist);
router.get("/playlist/:id", controller.getPlaylistById);
router.get("/playlists", controller.getAllPlaylists);

module.exports = router;
