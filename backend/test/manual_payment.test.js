const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoServer;

async function runTests() {
  console.log('--- STARTING TELEBIRR MANUAL PAYMENT & ADMIN QUEUE TESTS ---');
  let server;

  try {
    let targetUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      targetUri = mongoServer.getUri();
      console.log('[PASS] Started In-Memory MongoDB Server');
    } catch (e) {
      console.log('[INFO] Using external MongoDB URI:', targetUri);
    }

    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[PASS] MongoDB connected successfully');

    const User = require('../models/User');
    const PaymentRequest = require('../models/PaymentRequest');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create / Reset test regular user
    let regUser = await User.findOne({ phone: '0988000001' });
    if (!regUser) {
      regUser = await User.create({
        name: 'Telebirr Test User',
        phone: '0988000001',
        email: 'telebirr@ketero.app',
        password: hashedPassword,
        gender: 'female',
        age: 25,
        location: 'Addis Ababa',
        religion: 'Orthodox',
        role: 'user',
        isPremium: false,
      });
    } else {
      regUser.password = hashedPassword;
      regUser.isPremium = false;
      regUser.premiumExpiresAt = undefined;
      await regUser.save();
    }

    // Create / Reset test admin user
    let adminUser = await User.findOne({ phone: '0988000002' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Telebirr Admin',
        phone: '0988000002',
        email: 'telebirradmin@ketero.app',
        password: hashedPassword,
        gender: 'male',
        age: 32,
        location: 'Addis Ababa',
        religion: 'Orthodox',
        role: 'admin',
      });
    } else {
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // Start server internally
    const PORT = 5098;
    const app = express();
    server = require('http').createServer(app);

    app.use(express.json());
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/payments', require('../routes/payment'));
    app.use('/api/admin', require('../routes/adminRoutes'));

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`[PASS] Test server running on port ${PORT}`);

    const baseUrl = `http://localhost:${PORT}`;

    // Helper for fetch with retry
    const fetchWithRetry = async (url, options, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, options);
          if (res.status !== 500) return res;
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      return fetch(url, options);
    };

    // Step 1: Login Regular User & Admin
    const userLoginRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0988000001', password: 'password123' }),
    });
    const userLoginData = await userLoginRes.json();
    const userToken = userLoginData.token;

    const adminLoginRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0988000002', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    console.log('[PASS] Logged in Regular User & Admin successfully');

    // Step 2: Submit Telebirr Manual Payment Proof
    const submitRes = await fetchWithRetry(`${baseUrl}/api/payments/manual-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        transactionId: 'TB_TX_987654321',
        amount: 199,
        planType: 'monthly',
        receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
      }),
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok || !submitData.paymentRequest || submitData.paymentRequest.status !== 'pending') {
      throw new Error(`Submit payment proof failed: ${JSON.stringify(submitData)}`);
    }
    const requestId = submitData.paymentRequest._id;
    console.log('[PASS] Submitted Telebirr payment proof (Tx ID: TB_TX_987654321, Status: pending)');

    // Step 3: Duplicate submission block test
    const dupRes = await fetchWithRetry(`${baseUrl}/api/payments/manual-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        transactionId: 'TB_TX_999999999',
        amount: 199,
        planType: 'monthly',
        receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
      }),
    });
    if (dupRes.status !== 400) {
      throw new Error(`Duplicate submission was not blocked! Status: ${dupRes.status}`);
    }
    console.log('[PASS] Duplicate payment submission correctly blocked while pending');

    // Step 4: Fetch user payment status
    const statusRes = await fetchWithRetry(`${baseUrl}/api/payments/my-status`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const statusData = await statusRes.json();
    if (!statusRes.ok || statusData.paymentRequest.status !== 'pending') {
      throw new Error(`User my-status check failed: ${JSON.stringify(statusData)}`);
    }
    console.log('[PASS] User checked status and received pending payment record');

    // Step 5: Admin fetch pending payments queue
    const queueRes = await fetchWithRetry(`${baseUrl}/api/admin/pending-payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queueData = await queueRes.json();
    if (!queueRes.ok || !Array.isArray(queueData) || queueData.length === 0) {
      throw new Error(`Admin fetch pending queue failed: ${JSON.stringify(queueData)}`);
    }
    const firstQueueItem = queueData[0];
    if (!firstQueueItem.userId || !firstQueueItem.userId.name) {
      throw new Error('Pending queue user details were not populated correctly');
    }
    console.log('[PASS] Admin fetched pending payment queue populated with user info');

    // Step 6: Admin Rejects payment request
    const rejectRes = await fetchWithRetry(`${baseUrl}/api/admin/reject-payment/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Screenshot unreadable' }),
    });
    const rejectData = await rejectRes.json();
    if (!rejectRes.ok || rejectData.paymentRequest.status !== 'rejected') {
      throw new Error(`Reject payment failed: ${JSON.stringify(rejectData)}`);
    }
    console.log('[PASS] Admin rejected payment request with reason: "Screenshot unreadable"');

    // Step 7: Resubmit payment proof with new Tx ID
    const resubmitRes = await fetchWithRetry(`${baseUrl}/api/payments/manual-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        transactionId: 'TB_TX_REAL_12345',
        amount: 1499,
        planType: 'yearly',
        receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
      }),
    });
    const resubmitData = await resubmitRes.json();
    if (!resubmitRes.ok || !resubmitData.paymentRequest) {
      throw new Error(`Resubmit payment proof failed: ${JSON.stringify(resubmitData)}`);
    }
    const newRequestId = resubmitData.paymentRequest._id;
    console.log('[PASS] User resubmitted payment proof for Yearly plan (1499 ETB)');

    // Step 8: Admin Approves payment request
    const approveRes = await fetchWithRetry(`${baseUrl}/api/admin/approve-payment/${newRequestId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || approveData.paymentRequest.status !== 'approved' || !approveData.user.isPremium) {
      throw new Error(`Approve payment failed: ${JSON.stringify(approveData)}`);
    }
    console.log('[PASS] Admin approved payment request. User upgraded to VIP Gold Premium until:', approveData.user.premiumExpiresAt);

    console.log('--- ALL TELEBIRR MANUAL PAYMENT TESTS PASSED SUCCESSFULLY 🎉 ---');
  } catch (err) {
    console.error('VERIFICATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    console.log('[PASS] Test cleanup completed');
  }
}

runTests();
