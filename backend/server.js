const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // e.g., https://ketero.vercel.app
];

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    callback(null, true); // Allow mobile APK requests where origin header may be undefined
  }
};

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: corsOriginHandler,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ketero';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const callRoutes = require('./routes/calls');
const paymentRoutes = require('./routes/payment');
const messageRoutes = require('./routes/messages');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);

// Simple Status Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ketero Dating App API (Ethiopia)' });
});

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ketero_secret_key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication failed:', err);
    return next(new Error('Authentication error: Token invalid'));
  }
});

// Socket.io Connection & Event Handling
io.on('connection', (socket) => {
  console.log(`User connected to Chat: ${socket.user.name} (${socket.user._id})`);

  // Event: Join chat room with a matched user
  socket.on('join_match_room', async ({ targetUserId }) => {
    try {
      const currentUserId = socket.user._id.toString();
      
      // Verify in DB that these users are mutually matched
      const user = await User.findById(currentUserId);
      const isMatched = user.matches.includes(targetUserId);

      if (!isMatched) {
        socket.emit('error_message', { message: 'Chat is locked. You must match first to text.' });
        return;
      }

      // Generate a deterministic room name sorted by user IDs
      const sortedIds = [currentUserId, targetUserId].sort();
      const roomId = `room_${sortedIds[0]}_${sortedIds[1]}`;

      socket.join(roomId);
      console.log(`Socket [${socket.id}] joined room [${roomId}]`);
      
      socket.emit('room_joined', { roomId });
    } catch (error) {
      console.error('Error joining match room:', error);
      socket.emit('error_message', { message: 'Failed to join chat room.' });
    }
  });

  // Event: Send a message to a matched user
  socket.on('send_message', async ({ targetUserId, text }) => {
    try {
      const currentUserId = socket.user._id.toString();
      
      // Safety verification: make sure match still exists
      const user = await User.findById(currentUserId);
      const isMatched = user.matches.includes(targetUserId);

      if (!isMatched) {
        socket.emit('error_message', { message: 'Texting is locked. Match required.' });
        return;
      }

      const sortedIds = [currentUserId, targetUserId].sort();
      const roomId = `room_${sortedIds[0]}_${sortedIds[1]}`;

      const messageData = {
        senderId: currentUserId,
        senderName: socket.user.name,
        text,
        timestamp: new Date()
      };

      // Save user's message to MongoDB
      await Message.create({
        senderId: currentUserId,
        receiverId: targetUserId,
        text,
        timestamp: messageData.timestamp
      });

      // Broadcast message to everyone in the room (including sender)
      io.to(roomId).emit('new_message', messageData);
      console.log(`Message sent in room [${roomId}]: ${text}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error_message', { message: 'Failed to send message.' });
    }
  });

  // WebRTC Call Signaling (Audio calls: 100% Free, Video calls: Premium Gated)
  socket.on('call_signal', async (data) => {
    try {
      const { targetUserId, signal, callType } = data;
      const currentUserId = socket.user._id.toString();

      if (callType === 'video') {
        const user = await User.findById(currentUserId);
        if (!user.isPremium) {
          socket.emit('call_error', { 
            error: 'Premium Required', 
            message: 'Upgrade to premium using Telebirr/Chapa to start video calls. Voice calls are 100% free!' 
          });
          return;
        }
      }

      // Emit the WebRTC offer/answer/ice-candidate signal to the target user's personal socket room
      io.to(`user_${targetUserId}`).emit('incoming_call_signal', {
        callerId: currentUserId,
        callerName: socket.user.name,
        signal,
        callType
      });
    } catch (error) {
      console.error('Signaling Error:', error);
    }
  });

  // WebRTC Call Signaling (Standard events requested by client)
  socket.on('call-user', async (data) => {
    try {
      const { targetUserId, sdpOffer, callType } = data;
      const currentUserId = socket.user._id.toString();
      console.log(`WebRTC call-user (${callType || 'audio'}): ${socket.user.name} (${currentUserId}) -> ${targetUserId}`);

      if (callType === 'video') {
        const user = await User.findById(currentUserId);
        if (!user.isPremium) {
          socket.emit('call_error', { 
            error: 'Premium Required', 
            message: 'Upgrade to premium to start Video Calls.' 
          });
          return;
        }
      }

      io.to(`user_${targetUserId}`).emit('incoming-call', {
        callerId: currentUserId,
        callerName: socket.user.name,
        sdpOffer,
        callType: callType || 'audio'
      });
    } catch (error) {
      console.error('WebRTC call-user error:', error);
    }
  });

  socket.on('answer-call', async (data) => {
    try {
      const { targetUserId, sdpAnswer } = data;
      const currentUserId = socket.user._id.toString();
      console.log(`WebRTC answer-call: ${socket.user.name} (${currentUserId}) -> ${targetUserId}`);

      io.to(`user_${targetUserId}`).emit('call-answered', {
        sdpAnswer
      });
    } catch (error) {
      console.error('WebRTC answer-call error:', error);
    }
  });

  socket.on('ice-candidate', async (data) => {
    try {
      const { targetUserId, candidate } = data;
      const currentUserId = socket.user._id.toString();

      io.to(`user_${targetUserId}`).emit('ice-candidate', {
        candidate
      });
    } catch (error) {
      console.error('WebRTC ice-candidate error:', error);
    }
  });

  socket.on('end-call', async (data) => {
    try {
      const { targetUserId } = data;
      const currentUserId = socket.user._id.toString();
      console.log(`WebRTC end-call: ${socket.user.name} (${currentUserId}) -> ${targetUserId}`);

      io.to(`user_${targetUserId}`).emit('end-call');
    } catch (error) {
      console.error('WebRTC end-call error:', error);
    }
  });

  // Join personal notification channel
  socket.join(`user_${socket.user._id.toString()}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ketero server running on port ${PORT}`);
});
