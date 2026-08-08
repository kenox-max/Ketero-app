const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'profile-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
    }
  },
});

// @route   POST /api/users/profile-picture
// @desc    Direct Device Profile Picture Upload
router.post('/profile-picture', protect, (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return next();
  }
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.warn('Multer upload notice:', err.message);
    }
    next();
  });
}, async (req, res) => {
  try {
    let photoUrl;

    if (req.file) {
      // Relative path accessible via /uploads/filename
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body && req.body.image) {
      // Handle direct base64 / URL string payload
      photoUrl = req.body.image;
    } else {
      return res.status(400).json({ error: 'No image file or image payload provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profilePhoto = photoUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePhoto: photoUrl,
      user: {
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
        verifiedStatus: user.verifiedStatus,
        isPremium: user.isPremium,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error('Profile Picture Upload Error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile picture' });
  }
});

module.exports = router;
