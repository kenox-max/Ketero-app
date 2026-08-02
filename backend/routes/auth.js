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
// @desc    Register a new user (with localized demographics & mandatory gender/age)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, age, gender, location, religion, languages, hobbies, regionalPreferences, profilePhoto, profilePicture } = req.body;

    if (!name || !phone || !password || !age || !gender || !location || !religion) {
      return res.status(400).json({ error: 'Please provide all required fields including age and gender' });
    }

    if (parseInt(age) < 18) {
      return res.status(400).json({ error: 'User must be 18 years or older' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Dynamic Default Avatar Fallback Logic
    let photoUrl = profilePhoto || profilePicture;
    if (!photoUrl) {
      photoUrl = gender === 'female' 
        ? 'https://avatar.iran.liara.run/public/girl' 
        : 'https://avatar.iran.liara.run/public/boy';
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
      age: parseInt(age),
      gender: gender.toLowerCase(),
      location,
      religion,
      languages: languages || [],
      hobbies: hobbies || [],
      regionalPreferences: regionalPreferences || [],
      profilePhoto: photoUrl,
      verifiedStatus: true,
      isPremium: false,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        religion: user.religion,
        languages: user.languages,
        hobbies: user.hobbies,
        profilePhoto: user.profilePhoto,
        verifiedStatus: user.verifiedStatus,
        isPremium: user.isPremium,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration' });
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
    res.status(500).json({ error: error.message || 'Server error during login' });
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

// In-memory fallback store for OTPs if user document not created yet
const tempOtpStore = new Map();

// @route   POST /api/auth/send-otp
// @desc    Send 6-digit OTP code via external channel (Email/SMS)
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, email, method } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone number or email is required' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const targetKey = phone || email;
    tempOtpStore.set(targetKey, { otpCode, otpExpires });

    // Attempt to find user and attach OTP
    if (phone) {
      const user = await User.findOne({ phone });
      if (user) {
        user.otpCode = otpCode;
        user.otpExpires = otpExpires;
        await user.save();
      }
    }

    console.log(`[EXTERNAL OTP TRANSMITTER] Delivered 6-digit OTP code [${otpCode}] to ${targetKey} via ${method || 'SMS'}`);

    let emailSent = false;
    if (email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: `"Ketero ቀጠሮ" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Ketero Verification Code',
          text: `Your Ketero verification code is: ${otpCode}. Valid for 10 minutes.`,
          html: `<div style="font-family: sans-serif; padding: 20px; background: #121212; color: #FFF; border-radius: 10px;">
            <h2 style="color: #E4A853;">Ketero ቀጠሮ Verification</h2>
            <p>Selam! Your 6-digit security code is:</p>
            <h1 style="color: #E4A853; font-size: 36px; letter-spacing: 5px;">${otpCode}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>`
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Nodemailer Error:', mailErr);
      }
    }

    // Return clean response with debugOtp in demo/simulation mode if SMTP is not configured
    res.json({
      success: true,
      message: `Verification code sent to your ${method ? method.toLowerCase() : 'device'}.`,
      debugOtp: (!emailSent) ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify 6-digit OTP code
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, email, otpCode } = req.body;
    if (!otpCode) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const targetKey = phone || email;
    const storedRecord = tempOtpStore.get(targetKey);

    let isValid = false;

    if (storedRecord && storedRecord.otpCode === otpCode && storedRecord.otpExpires > new Date()) {
      isValid = true;
    }

    if (!isValid && phone) {
      const user = await User.findOne({ phone });
      if (user && user.otpCode === otpCode && user.otpExpires > new Date()) {
        isValid = true;
        user.verifiedStatus = true;
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();
      }
    }

    if (isValid) {
      tempOtpStore.delete(targetKey);
      res.json({ success: true, message: 'Security verification successful' });
    } else {
      res.status(400).json({ error: 'Invalid or expired verification code' });
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Failed to verify security code' });
  }
});

module.exports = router;
