const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ketero_secret_key', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (with localized demographics)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, age, location, religion, languages, hobbies, regionalPreferences } = req.body;

    if (!name || !phone || !password || !age || !location || !religion) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      age,
      location,
      religion,
      languages: languages || [],
      hobbies: hobbies || [],
      regionalPreferences: regionalPreferences || [],
      verifiedStatus: false,
      isPremium: false,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        location: user.location,
        religion: user.religion,
        languages: user.languages,
        hobbies: user.hobbies,
        verifiedStatus: user.verifiedStatus,
        isPremium: user.isPremium,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Please provide phone and password' });
    }

    // Check for user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      location: user.location,
      religion: user.religion,
      languages: user.languages,
      hobbies: user.hobbies,
      verifiedStatus: user.verifiedStatus,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.age = req.body.age || user.age;
      user.location = req.body.location || user.location;
      user.religion = req.body.religion || user.religion;
      user.languages = req.body.languages || user.languages;
      user.hobbies = req.body.hobbies || user.hobbies;
      user.email = req.body.email !== undefined ? req.body.email : user.email;
      user.regionalPreferences = req.body.regionalPreferences || user.regionalPreferences;
      
      if (req.body.profilePhoto) {
        user.profilePhoto = req.body.profilePhoto;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        age: updatedUser.age,
        location: updatedUser.location,
        religion: updatedUser.religion,
        languages: updatedUser.languages,
        hobbies: updatedUser.hobbies,
        verifiedStatus: updatedUser.verifiedStatus,
        isPremium: updatedUser.isPremium,
        profilePhoto: updatedUser.profilePhoto,
      });
    } else {
      res.status(444).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
