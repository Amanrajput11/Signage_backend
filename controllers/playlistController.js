const Playlist = require('../models/Playlist');
const Media = require('../models/Media');

exports.createPlaylist = async (req, res) => {
  try {
    const { title, description, media = [] } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });

    // verify media ownership
    for (const m of media) {
      const doc = await Media.findById(m);
      if (!doc || doc.owner.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid media or not owned' });
      }
    }

    const playlist = new Playlist({
      owner: req.user._id,
      title,
      description,
      media
    });
    await playlist.save();
    res.status(201).json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id }).populate('media').sort({ createdAt: -1 });
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPlaylist = async (req, res) => {
  try {
    const p = await Playlist.findById(req.params.id).populate('media');
    if (!p) return res.status(404).json({ message: 'Not found' });
    if (p.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const p = await Playlist.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    if (p.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

    const { title, description, media } = req.body;
    if (title !== undefined) p.title = title;
    if (description !== undefined) p.description = description;
    if (media !== undefined) {
      // validate media ownership
      for (const m of media) {
        const doc = await Media.findById(m);
        if (!doc || doc.owner.toString() !== req.user._id.toString()) {
          return res.status(400).json({ message: 'Invalid media or not owned' });
        }
      }
      p.media = media;
    }
    await p.save();
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const p = await Playlist.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    if (p.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    await p.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
