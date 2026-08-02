const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { createTelebirrH5PayPayload, verifySignature, buildSortedParamString } = require('../utils/telebirr');
const { initializeChapaPayment, verifyChapaPayment, verifyChapaWebhookSignature } = require('../utils/chapa');

// @route   POST /api/payments/checkout
// @desc    Initiate a Telebirr H5 Direct Pay or Chapa checkout session
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    const { amount = 150, provider = 'Telebirr', phoneNumber, returnUrl } = req.body;

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
// @desc    Generic/Simulated webhook endpoint to upgrade user isPremium status
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const { transactionId, userId, status, provider } = req.body;

    if (status === 'success') {
      let user = null;

      if (userId) {
        user = await User.findById(userId);
      }

      if (!user && transactionId) {
        const txn = await Transaction.findOne({ transactionId });
        if (txn) {
          user = await User.findById(txn.userId);
        }
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found for payment upgrade' });
      }

      user.isPremium = true;
      await user.save();

      if (transactionId) {
        await Transaction.findOneAndUpdate(
          { transactionId },
          { status: 'success', updatedAt: new Date() }
        );
      }

      console.log(`Payment SUCCESS: User ${user.name} (${user._id}) upgraded to Premium via ${provider || 'Webhook'}. Txn: ${transactionId}`);

      return res.json({
        success: true,
        message: `Subscription activated successfully for ${user.name}`,
        isPremium: user.isPremium,
      });
    }

    res.status(400).json({ success: false, message: 'Transaction status was not successful' });
  } catch (error) {
    console.error('Payment Webhook Error:', error);
    res.status(500).json({ error: 'Server error handling payment webhook' });
  }
});

// @route   POST /api/payments/chapa/webhook
// @desc    Official Chapa Webhook handler with HMAC signature verification
// @access  Public
router.post('/chapa/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-chapa-signature'] || req.headers['chapa-signature'];
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

    // Verify signature if secret and header are configured
    if (webhookSecret && signature) {
      const isValid = verifyChapaWebhookSignature(req.body, signature, webhookSecret);
      if (!isValid) {
        console.warn('Chapa Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const { tx_ref, status, event } = req.body;
    const isSuccess = status === 'success' || event === 'charge.success';

    if (tx_ref && isSuccess) {
      const txn = await Transaction.findOne({ transactionId: tx_ref });
      if (txn) {
        txn.status = 'success';
        await txn.save();

        const user = await User.findById(txn.userId);
        if (user) {
          user.isPremium = true;
          await user.save();
          console.log(`Chapa Webhook: Upgraded user ${user.name} to Premium`);
        }
      }
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

    if (sign && publicKey) {
      const dataToVerify = buildSortedParamString(bodyData);
      const isValid = verifySignature(dataToVerify, sign, publicKey);
      if (!isValid) {
        console.warn('Telebirr RSA signature verification failed for notify');
      }
    }

    // Telebirr considers '0' or 'SUCCESS' as successful payment
    const isSuccess = tradeStatus === '0' || tradeStatus === 'SUCCESS' || bodyData.status === 'success';

    if (outTradeNo) {
      const txn = await Transaction.findOne({ transactionId: outTradeNo });
      if (txn && isSuccess) {
        txn.status = 'success';
        await txn.save();

        const user = await User.findById(txn.userId);
        if (user) {
          user.isPremium = true;
          await user.save();
          console.log(`Telebirr Webhook: Upgraded user ${user.name} to Premium`);
        }
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
    const txn = await Transaction.findOne({ transactionId });

    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If transaction is pending and is Chapa, double check with Chapa API
    if (txn.status === 'pending' && txn.provider === 'Chapa') {
      const verification = await verifyChapaPayment(transactionId);
      if (verification.success) {
        txn.status = 'success';
        await txn.save();

        await User.findByIdAndUpdate(req.user._id, { isPremium: true });
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

module.exports = router;
