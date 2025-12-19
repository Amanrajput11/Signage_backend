const mongoose = require("mongoose");

const TvPairingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    deviceId: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TvPairing", TvPairingSchema);
