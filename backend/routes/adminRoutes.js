const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const PaymentRequest = require('../models/PaymentRequest');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Apply protection and admin middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/analytics
// @desc    Aggregate non-confidential app metrics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumSubscribers = await User.countDocuments({ isPremium: true });
    
    // Gender Demographics Ratio
    const maleCount = await User.countDocuments({ gender: 'male' });
    const femaleCount = await User.countDocuments({ gender: 'female' });
    
    // Active Today (users created or active today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeTodayCount = await User.countDocuments({ createdAt: { $gte: today } });

    // Active Socket Connections from express app instance if available
    const io = req.app.get('io');
    const activeSockets = io && io.engine ? io.engine.clientsCount : 0;

    // Total Reports & Pending Manual Payments
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const pendingPaymentsCount = await PaymentRequest.countDocuments({ status: 'pending' });

    res.json({
      totalUsers,
      activeToday: activeTodayCount || Math.min(totalUsers, 1),
      premiumSubscribers,
      genderDemographics: {
        male: maleCount,
        female: femaleCount,
        ratio: totalUsers > 0 ? `${Math.round((maleCount / totalUsers) * 100)}% M / ${Math.round((femaleCount / totalUsers) * 100)}% F` : 'N/A',
      },
      activeSockets,
      totalReports,
      pendingReports,
      pendingPaymentsCount,
    });
  } catch (error) {
    console.error('Admin Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

// @route   GET /api/admin/users
// @desc    Fetch users list returning ONLY public non-confidential data
//          EXCLUDING: Passwords, email, phone, location exact coordinates, private messages.
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('_id name gender age isPremium isVerified badgeType verifiedStatus role createdAt')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Admin Users Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

// @route   GET /api/admin/reports
// @desc    List all user-submitted support tickets
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email gender')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Admin Reports Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch support reports' });
  }
});

// @route   PATCH /api/admin/reports/:id
// @desc    Update ticket status ('in-progress' or 'resolved')
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be pending, in-progress, or resolved' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report ticket not found' });
    }

    report.status = status;
    await report.save();

    const updatedReport = await Report.findById(report._id).populate('reporterId', 'name email gender');
    res.json(updatedReport);
  } catch (error) {
    console.error('Admin Report Update Error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// @route   GET /api/admin/pending-payments
// @desc    Fetch all PaymentRequest documents where status is 'pending'
router.get('/pending-payments', async (req, res) => {
  try {
    const pendingPayments = await PaymentRequest.find({ status: 'pending' })
      .populate('userId', 'name email gender phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(pendingPayments);
  } catch (error) {
    console.error('Fetch Pending Payments Error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payment requests' });
  }
});

// @route   PATCH /api/admin/approve-payment/:requestId
// @desc    Approve manual Telebirr payment and activate VIP Premium on user record
router.patch('/approve-payment/:requestId', async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.requestId);
    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    if (paymentRequest.status === 'approved') {
      return res.status(400).json({ error: 'This payment request is already approved' });
    }

    paymentRequest.status = 'approved';
    paymentRequest.updatedAt = new Date();
    await paymentRequest.save();

    // Grant VIP Premium to User & Gold Verified Badge
    const user = await User.findById(paymentRequest.userId);
    if (user) {
      user.isPremium = true;
      user.badgeType = 'premium_verified';
      user.isVerified = true;
      user.verifiedStatus = true;
      const durationDays = paymentRequest.planType === 'yearly' ? 365 : 30;
      user.premiumExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      await user.save();
    }

    res.json({
      success: true,
      message: 'User upgraded to Premium Gold Verified successfully.',
      paymentRequest,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            isPremium: user.isPremium,
            badgeType: user.badgeType,
            isVerified: user.isVerified,
            premiumExpiresAt: user.premiumExpiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Approve Payment Error:', error);
    res.status(500).json({ error: 'Failed to approve payment request' });
  }
});

// @route   PATCH /api/admin/verify-photo/:userId
// @desc    Approve selfie photo verification and assign Photo Verified blue badge
router.patch('/verify-photo/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isVerified = true;
    user.verifiedStatus = true;
    // Keep premium_verified if user is already premium, otherwise set photo_verified
    if (!user.isPremium && user.badgeType !== 'premium_verified') {
      user.badgeType = 'photo_verified';
    }
    await user.save();

    res.json({
      success: true,
      message: `User ${user.name} photo verification approved (Blue Badge).`,
      user: {
        _id: user._id,
        name: user.name,
        isVerified: user.isVerified,
        badgeType: user.badgeType,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Photo Verification Approval Error:', error);
    res.status(500).json({ error: 'Failed to approve photo verification' });
  }
});

// @route   PATCH /api/admin/reject-payment/:requestId
// @desc    Reject manual Telebirr payment with rejection reason
router.patch('/reject-payment/:requestId', async (req, res) => {
  try {
    const { reason = 'Invalid Transaction ID or Screenshot' } = req.body;
    const paymentRequest = await PaymentRequest.findById(req.params.requestId);
    if (!paymentRequest) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    paymentRequest.status = 'rejected';
    paymentRequest.rejectionReason = reason;
    paymentRequest.updatedAt = new Date();
    await paymentRequest.save();

    res.json({
      success: true,
      message: 'Payment request rejected successfully.',
      paymentRequest,
    });
  } catch (error) {
    console.error('Reject Payment Error:', error);
    res.status(500).json({ error: 'Failed to reject payment request' });
  }
});

module.exports = router;
