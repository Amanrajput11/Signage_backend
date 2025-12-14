const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  mobile: { type: String, unique: true  },
  companyName: { type: String, trim: true },
  email: { type: String,
  trim: true,
  sparse: true,},
  password: { type: String },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  is_inactive: { type: Boolean, default: false },
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);