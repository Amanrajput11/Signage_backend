const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
require("./Helpers/mongoDb");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const debug = require("debug")(process.env.DEBUG + "server");
const mediaRoutes = require("./routes/mediaRoute");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
require("./Helpers/cron"); 

const app = express();


// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (restrict in production)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true
  },
  transports: ['websocket', 'polling'], 
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000 // 25 seconds
});

// Store connected users (userId -> socketId mapping)
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Register user with their userId
  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      console.log(`📊 Total connected users: ${connectedUsers.size}`);
      
      // Send confirmation back to client
      socket.emit('registered', { 
        success: true, 
        userId,
        message: 'Successfully registered for notifications' 
      });
    } else {
      console.log('⚠️ Registration attempted without userId');
    }
  });

  // Handle manual disconnect
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
    console.log('❌ Socket disconnected:', socket.id);
    console.log(`📊 Remaining connected users: ${connectedUsers.size}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Optional: Ping-pong to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Make io and connectedUsers accessible in routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

const corsOptions = {
  origin: "*", // Allow all origins (you can restrict this to specific domains)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Use CORS middleware with options
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Routes
app.use("/api/media", mediaRoutes);
app.use("/api/user", userRoutes);


// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running",
    connectedUsers: connectedUsers.size,
    socketIO: "enabled"
  });
});

// Socket.IO status endpoint
app.get("/api/socket-status", (req, res) => {
  res.json({
    success: true,
    connectedUsers: connectedUsers.size,
    userIds: Array.from(connectedUsers.keys())
  });
});

const PORT = process.env.PORT || 3051;

server.listen(PORT, "0.0.0.0", () => {
  debug("Listening on " + PORT);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled and ready`);
  console.log(`📡 WebSocket server: ws://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
