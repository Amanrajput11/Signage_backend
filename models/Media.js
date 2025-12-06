const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },   // stored filename / path
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number }, // bytes
  duration: { type: Number }, // optional: seconds (if you compute)
  type: { type: String, enum: ['image','video'], required: true },
  title: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
