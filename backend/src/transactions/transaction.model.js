/*
Transaction {
  _id,
  userId,
  type,               // ADD | SPEND
  category,           // food, bills, entertainment (null for ADD)
  amount,
  satisfactionScore,
  message,
  createdAt
}

 */
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    enum: ['ADD', 'SPEND'],
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'bills', 'entertainment', 'transport', 'shopping', 'health', 'other', 'education', 'salary', 'vacation', 'emergency', 'purchase', 'investment', 'home', 'car', 'savings', null],
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  message: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

module.exports = Transaction;

