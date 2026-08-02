const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPremiumSubscription } = require('../middleware/subscription');

// @route   POST /api/calls/initiate
// @desc    Initiate a voice or video call (Voice: 100% Free, Video: Premium Gated)
// @access  Private
router.post('/initiate', protect, async (req, res) => {
  try {
    const { targetUserId, callType } = req.body; // callType: 'voice' | 'video'

    if (!targetUserId || !callType) {
      return res.status(400).json({ error: 'targetUserId and callType (voice/video) are required' });
    }

    // Video calls are Premium Gated
    if (callType === 'video' && !req.user.isPremium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'Upgrade to premium using Telebirr or Chapa to start Video Calls. Voice calls are 100% free!',
        paymentGateways: ['Telebirr', 'Chapa'],
      });
    }

    const sessionId = `call_${req.user._id}_${targetUserId}_${Date.now()}`;

    res.status(200).json({
      success: true,
      message: 'Call session initiated successfully.',
      sessionId,
      callerId: req.user._id,
      targetUserId,
      callType,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
  } catch (error) {
    console.error('Call Initiation Error:', error);
    res.status(500).json({ error: 'Server error initiating call session' });
  }
});

module.exports = router;
