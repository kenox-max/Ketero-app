const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
  },
  receiptImageUrl: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  planType: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
