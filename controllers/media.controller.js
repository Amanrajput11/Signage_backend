const Media = require("../models/media.model");
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
}