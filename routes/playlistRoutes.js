const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const playlistController = require('../controllers/playlistController');

router.post('/',  playlistController.createPlaylist);
router.get('/',  playlistController.getPlaylists);
router.get('/:id',  playlistController.getPlaylist);
router.put('/:id',  playlistController.updatePlaylist);
router.delete('/:id',  playlistController.deletePlaylist);

module.exports = router;
