const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const playlistController = require('../controllers/playlistController');

router.post('/', auth, playlistController.createPlaylist);
router.get('/', auth, playlistController.getPlaylists);
router.get('/:id', auth, playlistController.getPlaylist);
router.put('/:id', auth, playlistController.updatePlaylist);
router.delete('/:id', auth, playlistController.deletePlaylist);

module.exports = router;
