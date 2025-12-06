const path = require('path');
const Media = require('../models/Media');
const fs = require('fs');

exports.uploadMedia = async (req, res) => {
  try {
    // multer will attach file(s)
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const saved = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const type = ext.match(/mp4|mov|webm|mkv|avi/) ? 'video' : 'image';
      const media = new Media({
        owner: req.user._id,
        filename: path.relative(process.cwd(), file.path),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type
      });
      await media.save();
      saved.push(media);
    }
    res.status(201).json({ uploaded: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload error' });
  }
};

exports.listUserMedia = async (req, res) => {
  try {
    const ownerId = req.params.userId;
    // only owner or admin (no admin here) can fetch — simple check
    if (req.user._id.toString() !== ownerId) return res.status(403).json({ message: 'Forbidden' });
    const items = await Media.find({ owner: ownerId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const id = req.params.id;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ message: 'Not found' });
    if (media.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

    // delete file
    const filePath = path.join(process.cwd(), media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await media.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
