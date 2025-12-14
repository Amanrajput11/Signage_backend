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

module.exports = router;
