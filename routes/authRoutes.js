const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const authController = require('../controllers/authController');

// signup with optional profile image. Use multipart/form-data: name, email, password, profileImage
router.post('/signup', upload.single('profileImage'), authController.signup);
router.post('/login', authController.login);

module.exports = router;
