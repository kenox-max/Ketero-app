const checkPremiumSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.isPremium) {
    next();
  } else {
    // Return 403 with specific response structure directing the frontend to show the Telebirr/Chapa screen.
    res.status(403).json({
      error: 'Premium Subscription Required',
      code: 'PREMIUM_REQUIRED',
      paymentGateways: ['Telebirr', 'Chapa'],
      message: 'This feature is locked. Please upgrade to Premium using Telebirr or Chapa to access voice and video calls.'
    });
  }
};

module.exports = { checkPremiumSubscription };
