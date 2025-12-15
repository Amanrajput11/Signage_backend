const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const {
  signAccessToken,
  signRefreshToken,
} = require("../Helpers/jwt_helper");

module.exports = {
    create : async (req, res) => {
  try {
    const {
      fullName,
      address,
      city,
      mobile,
      companyName,
      email,
    } = req.body;

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "ChangeMe@123";

    const user = new User({
      fullName,
      address,
      city,
      mobile,
      companyName,
      email,
      password: defaultPassword, 
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

login: async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.is_inactive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ USE JWT HELPER (IMPORTANT)
    const accessToken = await signAccessToken(user._id);
    const refreshToken = await signRefreshToken(user._id);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        is_inactive: user.is_inactive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},
  getProfile: async (req, res) => {
    try {
      // req.user is already fetched in verifyAccessToken
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = req.user.toObject();
      delete user.password;

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ================= UPDATE PASSWORD =================
  updatePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          message: "Old password and new password are required",
        });
      }

      const user = req.user;

      // Check old password
      const isMatch = await user.isValidPassword(oldPassword);
      if (!isMatch) {
        return res.status(401).json({
          message: "Old password is incorrect",
        });
      }

      // Update password (bcrypt runs automatically)
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
}