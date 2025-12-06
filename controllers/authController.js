const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    let profileImagePath = null;
    if (req.file) {
      // file stored by multer; send relative path
      profileImagePath = path.relative(process.cwd(), req.file.path);
    }

    const user = new User({
      name,
      email,
      password: hashed,
      profileImage: profileImagePath
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
