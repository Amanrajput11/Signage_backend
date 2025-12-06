const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // hashed
  profileImage: { type: String }, // path to uploaded image
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
