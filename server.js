require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const playlistRoutes = require('./routes/playlistRoutes');

const app = express();
app.use(cors());
app.use(express.json()); // for json bodies
app.use(express.urlencoded({ extended: true }));

connectDB(process.env.MONGO_URI);

// serve uploads statically (careful: only if you want direct access)
app.use('/uploads', express.static(process.env.UPLOAD_BASE || 'uploads'));

// mount routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/playlists', playlistRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
