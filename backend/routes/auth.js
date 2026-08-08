const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendOTPCode = require('../utils/sendEmail');

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
      verifiedStatus: false,
      isVerified: false,
      badgeType: 'none',
      isPremium: false,
    });

    if (user) {
      const fullUserObj = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        religion: user.religion,
        languages: user.languages || [],
        hobbies: user.hobbies || [],
        profilePhoto: user.profilePhoto,
        verifiedStatus: false,
        isVerified: false,
        badgeType: 'none',
        isPremium: false,
        role: user.role || 'user',
        likes: user.likes || [],
        matches: user.matches || [],
      };

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        ...fullUserObj,
        user: fullUserObj,
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
      gender: user.gender,
      location: user.location,
      religion: user.religion,
      languages: user.languages,
      hobbies: user.hobbies,
      profilePhoto: user.profilePhoto,
      verifiedStatus: user.verifiedStatus,
      isVerified: user.isVerified || false,
      badgeType: user.badgeType || 'none',
      isPremium: user.isPremium,
      role: user.role || 'user',
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
        isVerified: updatedUser.isVerified || false,
        badgeType: updatedUser.badgeType || 'none',
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
// @desc    Send 6-digit OTP code via Gmail SMTP Nodemailer
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

    const recipientEmail = email || (phone ? `${phone}@ketero.app` : null);
    let emailSent = false;
    let mailErrorMessage = null;

    const hasSmtpConfig = Boolean(
      (process.env.BREVO_USER && process.env.BREVO_PASS) ||
      (process.env.SMTP_USER && process.env.SMTP_PASS) ||
      (process.env.EMAIL_USER && process.env.EMAIL_PASS)
    );

    if (recipientEmail && hasSmtpConfig) {
      try {
        await sendOTPCode(recipientEmail, otpCode);
        console.log(`[SMTP EMAIL] Successfully delivered OTP code to ${recipientEmail}`);
        emailSent = true;
      } catch (mailErr) {
        console.error('[SMTP ERROR] Failed to deliver email:', mailErr);
        mailErrorMessage = mailErr.message || 'SMTP delivery failed';
      }
    } else {
      console.log(`[EXTERNAL OTP TRANSMITTER (SIMULATION)] 6-digit OTP code [${otpCode}] generated for ${targetKey}`);
    }

    // If SMTP is configured but sending failed, return error to client
    if (hasSmtpConfig && !emailSent) {
      return res.status(500).json({
        error: `Failed to send email (${mailErrorMessage}). Please check your SMTP settings in backend/.env`,
        devOtp: otpCode,
      });
    }

    // Response logic
    const responsePayload = {
      success: true,
      message: emailSent
        ? `Verification code sent to ${recipientEmail}`
        : `[Simulation Mode] Verification code generated for ${targetKey}. (SMTP credentials not configured in backend/.env)`,
    };

    // Attach devOtp if in dev mode or email not sent so user is never blocked
    if (!emailSent || process.env.NODE_ENV !== 'production') {
      responsePayload.devOtp = otpCode;
    }

    res.json(responsePayload);
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

// @route   POST /api/auth/forgot-password
// @desc    Self-Service Password Reset via Email Verification (Generates 6-digit 15-min token)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Generate 6-digit reset token valid for 15 minutes
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    let emailSent = false;
    const hasSmtpConfig = Boolean(
      (process.env.BREVO_USER && process.env.BREVO_PASS) ||
      (process.env.SMTP_USER && process.env.SMTP_PASS) ||
      (process.env.EMAIL_USER && process.env.EMAIL_PASS)
    );

    if (hasSmtpConfig) {
      try {
        await sendOTPCode(user.email, resetToken);
        emailSent = true;
      } catch (mailErr) {
        console.error('[RESET PASSWORD EMAIL ERROR]:', mailErr);
      }
    }

    const responsePayload = {
      success: true,
      message: emailSent
        ? `Password reset code sent to ${user.email}`
        : `Password reset token generated for ${user.email}`,
    };

    if (!emailSent || process.env.NODE_ENV !== 'production') {
      responsePayload.devOtp = resetToken;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Validate token and hash new password using bcrypt
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Please provide email, verification token, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (
      !user.resetPasswordToken ||
      user.resetPasswordToken !== token ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;

