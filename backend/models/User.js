const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100,
  },
  otpCode: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  location: {
    type: String,
    required: true, // e.g., "Addis Ababa", "Hawassa", "Adama"
  },
  religion: {
    type: String,
    required: true,
    enum: ['Orthodox', 'Protestant', 'Muslim', 'Catholic', 'Other'],
  },
  languages: {
    type: [String], // e.g., ['Amharic', 'Afaan Oromoo', 'Tigrinya']
    default: [],
  },
  hobbies: {
    type: [String],
    default: [],
  },
  regionalPreferences: {
    type: [String], // Preferences for partner location
    default: [],
  },
  profilePhoto: {
    type: String, // URL/Path to user's photo
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  },
  verifiedStatus: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  badgeType: {
    type: String,
    enum: ['none', 'photo_verified', 'premium_verified'],
    default: 'none',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiresAt: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  isSystemUser: {
    type: Boolean,
    default: false,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', UserSchema);
