const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const mediaController = require('../controllers/mediaController');

// upload multiple files
router.post('/upload', auth, upload.array('files', 10), mediaController.uploadMedia);

// list media for a user (only owner)
router.get('/user/:userId', auth, mediaController.listUserMedia);

// delete media
router.delete('/:id', auth, mediaController.deleteMedia);

module.exports = router;
