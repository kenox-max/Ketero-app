const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PaymentRequest = require('../models/PaymentRequest');
const { protect } = require('../middleware/auth');
const { upload, uploadImageBuffer } = require('../config/cloudinary');
const { createTelebirrH5PayPayload, verifySignature, buildSortedParamString } = require('../utils/telebirr');
const { initializeChapaPayment, verifyChapaPayment, verifyChapaWebhookSignature } = require('../utils/chapa');

// @route   POST /api/payments/checkout
// @desc    Initiate a Telebirr H5 Direct Pay or Chapa checkout session
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    const { provider = 'Telebirr', phoneNumber, returnUrl } = req.body;
    const amount = Number(process.env.PREMIUM_PRICE_ETB || 150);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(503).json({ error: 'Premium checkout pricing is not configured correctly' });
    }

    if (!provider || !['Telebirr', 'Chapa'].includes(provider)) {
      return res.status(400).json({ error: 'Valid payment provider (Telebirr or Chapa) is required' });
    }

    const userId = req.user._id;
    const userEmail = req.user.email || `${req.user.phone || 'user'}@ketero.et`;
    const userName = req.user.name || 'Ketero User';
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || 'Ketero';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    let transactionId;
    let paymentUrl;
    let rawPayload = null;

    if (provider === 'Chapa') {
      const tx_ref = `KTR_CHAPA_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      transactionId = tx_ref;

      const chapaResult = await initializeChapaPayment({
        amount,
        currency: 'ETB',
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        tx_ref,
        return_url: returnUrl || 'https://ketero.et/payment/success',
        customization: {
          title: 'Ketero Premium',
          description: 'Unlock unlimited voice/video calls & VIP badge',
        },
      });

      paymentUrl = chapaResult.checkout_url;
      rawPayload = chapaResult.rawResponse || { tx_ref };
    } else if (provider === 'Telebirr') {
      const outTradeNo = `KTR_TB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      transactionId = outTradeNo;

      const telebirrResult = createTelebirrH5PayPayload({
        outTradeNo,
        totalAmount: amount,
        subject: 'Ketero Premium Subscription',
        returnUrl: returnUrl || 'https://ketero.et/payment/success',
      });

      paymentUrl = telebirrResult.paymentUrl;
      rawPayload = telebirrResult.rawPayload;
    }

    // Save transaction in database
    await Transaction.create({
      userId,
      transactionId,
      amount,
      currency: 'ETB',
      provider,
      phoneNumber: phoneNumber || req.user.phone,
      status: 'pending',
      paymentUrl,
      rawPayload,
    });

    res.json({
      success: true,
      transactionId,
      paymentUrl,
      provider,
      rawPayload,
      message: `Checkout session created via ${provider}. Complete payment using the link.`,
    });
  } catch (error) {
    console.error('Payment Checkout Error:', error);
    res.status(500).json({ error: 'Server error generating checkout session', details: error.message });
  }
});

// @route   POST /api/payments/webhook
// Retired demo endpoint. Client-submitted success claims must never grant entitlements.
router.post('/webhook', (req, res) => {
  res.status(410).json({ error: 'This simulated payment endpoint is disabled' });
});

// @route   POST /api/payments/chapa/webhook
// @desc    Official Chapa Webhook handler with HMAC signature verification
// @access  Public
router.post('/chapa/webhook', async (req, res) => {
  try {
    const signatures = [req.headers['x-chapa-signature'], req.headers['chapa-signature']].filter(Boolean);
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

    if (!webhookSecret || signatures.length === 0 ||
        !signatures.some((signature) => verifyChapaWebhookSignature(req.rawBody, signature, webhookSecret))) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { tx_ref, status, event } = req.body;
    const isSuccess = status === 'success' || event === 'charge.success';

    if (tx_ref && isSuccess) {
      const txn = await Transaction.findOne({ transactionId: tx_ref, provider: 'Chapa' });
      if (!txn) return res.status(404).json({ error: 'Transaction not found' });
      const verification = await verifyChapaPayment(tx_ref);
      const verified = verification.data?.data || {};
      const amountMatches = Number(verified.amount) === Number(txn.amount);
      const referenceMatches = verified.tx_ref === txn.transactionId;
      const currencyMatches = String(verified.currency || '').toUpperCase() === String(txn.currency || 'ETB').toUpperCase();

      if (!verification.success || verified.status !== 'success' || !amountMatches || !referenceMatches || !currencyMatches) {
        return res.status(400).json({ error: 'Provider transaction verification did not match the expected payment' });
      }

      const updated = await Transaction.findOneAndUpdate(
        { _id: txn._id, status: 'pending' },
        { $set: { status: 'success', updatedAt: new Date() } },
        { new: true }
      );
      if (updated) await User.findByIdAndUpdate(updated.userId, { $set: { isPremium: true, badgeType: 'premium_verified' } });
    }

    res.json({ success: true, message: 'Chapa webhook processed' });
  } catch (error) {
    console.error('Chapa Webhook Error:', error);
    res.status(500).json({ error: 'Server error processing Chapa webhook' });
  }
});

// @route   POST /api/payments/telebirr/webhook
// @desc    Official Telebirr H5 Direct Pay Webhook handler with RSA signature verification
// @access  Public
router.post('/telebirr/webhook', async (req, res) => {
  try {
    const bodyData = req.body || {};
    const { outTradeNo, sign, tradeStatus } = bodyData;

    const publicKey = process.env.TELEBIRR_PUBLIC_KEY;

    if (!publicKey || !sign || !outTradeNo) {
      return res.status(401).json({ code: 1, message: 'Signature configuration or fields missing' });
    }
    const dataToVerify = buildSortedParamString(bodyData);
    if (!verifySignature(dataToVerify, sign, publicKey)) {
      return res.status(401).json({ code: 1, message: 'Invalid signature' });
    }

    // Telebirr considers '0' or 'SUCCESS' as successful payment
    const isSuccess = tradeStatus === '0' || tradeStatus === 'SUCCESS' || bodyData.status === 'success';

    if (outTradeNo) {
      const txn = await Transaction.findOne({ transactionId: outTradeNo, provider: 'Telebirr' });
      if (txn && isSuccess) {
        const paidAmount = bodyData.totalAmount ?? bodyData.amount ?? bodyData.transAmount;
        if (!Number.isFinite(Number(paidAmount)) || Number(paidAmount) !== Number(txn.amount)) {
          return res.status(400).json({ code: 1, message: 'Payment amount mismatch' });
        }
        const updated = await Transaction.findOneAndUpdate(
          { _id: txn._id, status: 'pending' },
          { $set: { status: 'success', updatedAt: new Date() } },
          { new: true }
        );
        if (updated) await User.findByIdAndUpdate(updated.userId, { $set: { isPremium: true, badgeType: 'premium_verified' } });
      }
    }

    // Telebirr requires standard JSON code response
    res.json({ code: 0, message: 'success' });
  } catch (error) {
    console.error('Telebirr Webhook Error:', error);
    res.status(500).json({ code: 1, message: 'fail', error: error.message });
  }
});

// @route   GET /api/payments/verify/:transactionId
// @desc    Verify transaction status and sync premium state
// @access  Private
router.get('/verify/:transactionId', protect, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const txn = await Transaction.findOne({ transactionId, userId: req.user._id });

    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If transaction is pending and is Chapa, double check with Chapa API
    if (txn.status === 'pending' && txn.provider === 'Chapa') {
      const verification = await verifyChapaPayment(transactionId);
      const verified = verification.data?.data || {};
      const validVerification = verification.success && verified.status === 'success' &&
        verified.tx_ref === txn.transactionId && Number(verified.amount) === Number(txn.amount) &&
        String(verified.currency || '').toUpperCase() === String(txn.currency || 'ETB').toUpperCase();
      if (validVerification) {
        const updated = await Transaction.findOneAndUpdate(
          { _id: txn._id, status: 'pending' },
          { $set: { status: 'success', updatedAt: new Date() } },
          { new: true }
        );
        if (updated) await User.findByIdAndUpdate(updated.userId, { $set: { isPremium: true, badgeType: 'premium_verified' } });
        txn.status = 'success';
        req.user.isPremium = true;
      }
    }

    res.json({
      success: true,
      transactionId: txn.transactionId,
      status: txn.status,
      provider: txn.provider,
      amount: txn.amount,
      isPremium: req.user.isPremium,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Server error verifying payment status' });
  }
});

// @route   GET /api/payments/telebirr/rsa-test
// @desc    Utility endpoint to test Telebirr RSA signing and verification
// @access  Public
router.get('/telebirr/rsa-test', (req, res) => {
  try {
    const payload = createTelebirrH5PayPayload({
      outTradeNo: 'TEST_TXN_123',
      totalAmount: 150,
    });

    const isVerified = verifySignature(
      payload.rawParamString,
      payload.sign,
      process.env.TELEBIRR_PUBLIC_KEY
    );

    res.json({
      success: true,
      rsaWorking: isVerified,
      outTradeNo: payload.outTradeNo,
      sign: payload.sign.substring(0, 30) + '...',
      paymentUrl: payload.paymentUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/payments/manual-submit
// @desc    Submit Telebirr manual payment proof (Transaction ID + Screenshot)
// @access  Private
router.post('/manual-submit', protect, upload.single('receiptImage'), async (req, res) => {
  try {
    const { transactionId, amount = 199, planType = 'monthly' } = req.body;

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ error: 'Telebirr Transaction ID is required' });
    }
    const normalizedTransactionId = transactionId.trim();
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0 || !['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ error: 'Valid payment amount and plan are required' });
    }
    if (await PaymentRequest.exists({ transactionId: normalizedTransactionId })) {
      return res.status(409).json({ error: 'This transaction reference has already been submitted' });
    }

    let receiptImageUrl;
    if (req.file) {
      receiptImageUrl = await uploadImageBuffer(req.file.buffer, req.file.originalname, 'receipts');
    } else if (req.body.receiptImageUrl) {
      receiptImageUrl = req.body.receiptImageUrl;
    } else {
      return res.status(400).json({ error: 'Receipt screenshot image is required' });
    }

    // Check if user already has a pending payment request
    const existingPending = await PaymentRequest.findOne({
      userId: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        error: 'You already have a pending payment request under review by Admin. Please wait 15-30 minutes.',
        paymentRequest: existingPending,
      });
    }

    const paymentRequest = await PaymentRequest.create({
      userId: req.user._id,
      transactionId: normalizedTransactionId,
      receiptImageUrl,
      amount: amountValue,
      planType,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Payment proof submitted successfully. Admin will review within 15-30 minutes.',
      paymentRequest,
    });
  } catch (error) {
    console.error('Manual Payment Submission Error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit payment proof' });
  }
});

// @route   GET /api/payments/my-status
// @desc    Get logged-in user active/pending manual payment request status
// @access  Private
router.get('/my-status', protect, async (req, res) => {
  try {
    const latestRequest = await PaymentRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      paymentRequest: latestRequest,
      isPremium: req.user.isPremium,
      premiumExpiresAt: req.user.premiumExpiresAt,
    });
  } catch (error) {
    console.error('Get Payment Status Error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

module.exports = router;
