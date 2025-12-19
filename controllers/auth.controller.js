const User = require("../models/user.model");
const TvPairing = require("../models/TvPairing.model");
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
      return res.status(403).json({
        message: "Your account is inactive. Please contact admin.",
      });
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

// ================= GET ALL USERS =================
getAllUsers: async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // 🔍 Search filter
    const filter = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      total,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    console.error("GET USERS ERROR 👉", error);
    res.status(500).json({
      message: "Failed to fetch users",
    });
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


  // ================= ACTIVATE / INACTIVATE USER =================
updateUserStatus: async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_inactive } = req.body;

    // Validation
    if (typeof is_inactive !== "boolean") {
      return res.status(400).json({
        message: "is_inactive must be true or false",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { is_inactive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: is_inactive
        ? "User inactivated successfully"
        : "User activated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
},

/* ================= TV: GENERATE CODE ================= */
generateTvCode: async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID required" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await TvPairing.create({
      code,
      deviceId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    res.status(200).json({
      success: true,
      code,
      expiresIn: 300,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

/* ================= TV: PAIR DEVICE ================= */
pairTv: async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const pairing = await TvPairing.findOne({
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!pairing) {
      return res.status(400).json({
        message: "Invalid or expired TV code",
      });
    }

    pairing.isUsed = true;
    pairing.userId = userId;
    await pairing.save();

    res.status(200).json({
      success: true,
      message: "TV paired successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

/* ================= TV: CHECK STATUS ================= */
checkTvStatus: async (req, res) => {
  try {
    const { code } = req.params;

    const pairing = await TvPairing.findOne({ code });

    if (!pairing || !pairing.isUsed) {
      return res.status(200).json({ paired: false });
    }

    const accessToken = await signAccessToken(pairing.userId);
    const refreshToken = await signRefreshToken(pairing.userId);

    // Optional cleanup
    await TvPairing.deleteOne({ _id: pairing._id });

    res.status(200).json({
      paired: true,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

}