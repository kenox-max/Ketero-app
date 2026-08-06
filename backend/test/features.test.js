const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoServer;

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE BACKEND VERIFICATION TESTS ---');
  let server;

  try {
    let targetUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    // Try MongoDB Memory Server if available or as fallback
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      targetUri = mongoServer.getUri();
      console.log('[PASS] Started In-Memory MongoDB Server for fast isolated testing');
    } catch (e) {
      console.log('[INFO] Using external MongoDB URI:', targetUri);
    }

    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[PASS] MongoDB connected successfully');

    const User = require('../models/User');
    const Report = require('../models/Report');
    const Story = require('../models/Story');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create / Reset test regular user
    let regUser = await User.findOne({ phone: '0999000001' });
    if (!regUser) {
      regUser = await User.create({
        name: 'Test Regular User',
        phone: '0999000001',
        email: 'regular@ketero.app',
        password: hashedPassword,
        gender: 'female',
        age: 23,
        location: 'Addis Ababa',
        religion: 'Orthodox',
        role: 'user',
      });
    } else {
      regUser.password = hashedPassword;
      await regUser.save();
    }

    // Create / Reset test admin user
    let adminUser = await User.findOne({ phone: '0999000002' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Test System Admin',
        phone: '0999000002',
        email: 'admin@ketero.app',
        password: hashedPassword,
        gender: 'male',
        age: 30,
        location: 'Addis Ababa',
        religion: 'Orthodox',
        role: 'admin',
      });
    } else {
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      await adminUser.save();
    }

    console.log('[PASS] Test users verified in DB');

    // Start server internally
    const PORT = 5099;
    const app = express();
    server = require('http').createServer(app);
    const io = require('socket.io')(server);
    app.set('io', io);

    app.use(express.json());
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/admin', require('../routes/adminRoutes'));
    app.use('/api/reports', require('../routes/reportRoutes'));
    app.use('/api/stories', require('../routes/storyRoutes'));
    app.use('/api/users', require('../routes/userRoutes'));

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

    // Test 1: Login Regular User
    const regLoginRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0999000001', password: 'password123' }),
    });
    const regLoginData = await regLoginRes.json();
    if (!regLoginRes.ok || !regLoginData.token) {
      throw new Error(`Regular user login failed: ${JSON.stringify(regLoginData)}`);
    }
    let userToken = regLoginData.token;
    console.log('[PASS] Regular User Login Token retrieved');

    // Test 2: Login Admin User
    const adminLoginRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0999000002', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || adminLoginData.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    let adminToken = adminLoginData.token;
    console.log('[PASS] Admin User Login & Role verified');

    // Test 3: Admin RBAC Middleware (Access Control)
    const forbiddenRes = await fetchWithRetry(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (forbiddenRes.status !== 403) {
      throw new Error(`RBAC failure: Non-admin was not blocked. Status: ${forbiddenRes.status}`);
    }
    console.log('[PASS] Non-admin access to /api/admin/analytics correctly returned 403 Forbidden');

    const adminAnalyticsRes = await fetchWithRetry(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await adminAnalyticsRes.json();
    if (!adminAnalyticsRes.ok || analyticsData.totalUsers === undefined) {
      throw new Error(`Admin analytics failed: ${JSON.stringify(analyticsData)}`);
    }
    console.log('[PASS] Admin Analytics endpoint returned metrics:', analyticsData);

    // Test 4: Admin Non-Confidential Users Directory
    const adminUsersRes = await fetchWithRetry(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await adminUsersRes.json();
    if (!adminUsersRes.ok || !Array.isArray(usersData)) {
      throw new Error(`Admin users list failed: ${JSON.stringify(usersData)}`);
    }
    const firstUser = usersData[0];
    if (firstUser.password !== undefined || firstUser.phone !== undefined || firstUser.email !== undefined) {
      throw new Error('Privacy leak! Private fields were not excluded.');
    }
    console.log('[PASS] Admin Users directory strictly returned non-confidential data (Passwords, Phone, Email excluded)');

    // Test 5: In-App Support Ticket System
    const createReportRes = await fetchWithRetry(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        subject: 'Test Billing Query',
        description: 'Need assistance with Chapa payment confirmation',
      }),
    });
    const reportData = await createReportRes.json();
    if (!createReportRes.ok || reportData.status !== 'pending') {
      throw new Error(`Create report failed: ${JSON.stringify(reportData)}`);
    }
    console.log('[PASS] User submitted support ticket successfully');

    const userReportsRes = await fetchWithRetry(`${baseUrl}/api/reports/my-reports`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userReportsData = await userReportsRes.json();
    if (!userReportsRes.ok || !Array.isArray(userReportsData) || userReportsData.length === 0) {
      throw new Error(`Fetch user reports failed: ${JSON.stringify(userReportsData)}`);
    }
    console.log('[PASS] User retrieved personal ticket resolution history');

    const patchReportRes = await fetchWithRetry(`${baseUrl}/api/admin/reports/${reportData._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const patchedReportData = await patchReportRes.json();
    if (!patchReportRes.ok || patchedReportData.status !== 'resolved') {
      throw new Error(`Patch report status failed: ${JSON.stringify(patchedReportData)}`);
    }
    console.log('[PASS] Admin updated support ticket status to "resolved"');

    // Test 6: Self-Service Password Reset via Email Verification
    const forgotRes = await fetchWithRetry(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'regular@ketero.app' }),
    });
    const forgotData = await forgotRes.json();
    if (!forgotRes.ok || !forgotData.devOtp) {
      throw new Error(`Forgot password request failed: ${JSON.stringify(forgotData)}`);
    }
    console.log('[PASS] Forgot Password generated 6-digit reset token:', forgotData.devOtp);

    const resetRes = await fetchWithRetry(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'regular@ketero.app',
        token: forgotData.devOtp,
        newPassword: 'newpassword123',
      }),
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok || !resetData.success) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
    }
    console.log('[PASS] Reset Password updated hashed password in DB');

    const newLoginRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0999000001', password: 'newpassword123' }),
    });
    const newLoginData = await newLoginRes.json();
    if (!newLoginRes.ok || !newLoginData.token) {
      throw new Error('Login with newly reset password failed');
    }
    userToken = newLoginData.token;
    console.log('[PASS] Authenticated with newly reset password');

    // Test 7: Temporary 24-Hour Story System
    const createStoryRes = await fetchWithRetry(`${baseUrl}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        caption: 'Enjoying traditional coffee in Addis Ababa! ☕',
      }),
    });
    const storyData = await createStoryRes.json();
    if (!createStoryRes.ok || !storyData.expiresAt) {
      throw new Error(`Create story failed: ${JSON.stringify(storyData)}`);
    }
    console.log('[PASS] Story created with 24-hour expiration:', storyData.expiresAt);

    const getStoriesRes = await fetchWithRetry(`${baseUrl}/api/stories`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const activeStories = await getStoriesRes.json();
    if (!getStoriesRes.ok || !Array.isArray(activeStories) || activeStories.length === 0) {
      throw new Error(`Fetch active stories failed: ${JSON.stringify(activeStories)}`);
    }
    console.log('[PASS] Active stories retrieved for StoryBar feed');

    console.log('--- ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY 🎉 ---');
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
