const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }], // ordered list
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Playlist', PlaylistSchema);
