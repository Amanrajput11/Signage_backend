const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  sNo: { type: Number ,unique: true },
  fullName: { type: String, trim: true },
  gotra: { type: String, trim: true },
  fatherName: { type: String, trim: true },
  address: { type: String, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  state: { type: String, trim: true },
  phone: { type: String, trim: true },
  mobile: { type: String, unique: true  },
  occupation: { type: String, trim: true },
  yearsInIndore: { type: String, trim: true },
  
  image: {
    type: String,
    required: false
  },

  // Optional general fields
  name: { type: String }, // Can be used for display if you want to merge names
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


// 🔐 Hash password automatically before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

// 🔍 Compare password for login
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);