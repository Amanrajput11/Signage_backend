const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

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

login : async (req, res) => {
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

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        is_inactive: user.is_inactive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
}