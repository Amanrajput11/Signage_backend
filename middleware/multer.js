const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = process.env.UPLOAD_BASE || './uploads';

// Ensure base exists
if (!fs.existsSync(UPLOAD_BASE)) fs.mkdirSync(UPLOAD_BASE, { recursive: true });

// storage that puts files in uploads/{userId}/ or uploads/profile/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // for signup profile image we use 'profile', else if user authenticated use user id folder
    const isProfile = req.baseUrl && req.baseUrl.includes('/auth') && req.path.includes('/signup');
    let dest;
    if (isProfile && !req.user) {
      dest = path.join(UPLOAD_BASE, 'profiles');
    } else {
      // if authenticated, req.user should be populated by auth middleware earlier.
      const userId = req.user ? req.user._id.toString() : 'anonymous';
      dest = path.join(UPLOAD_BASE, userId);
    }
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // timestamp + originalname (sanitized)
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  }
});

// file filter: only images and videos
function fileFilter (req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|webm|mkv|avi/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB per file (adjust as needed)
  }
});

module.exports = upload;
