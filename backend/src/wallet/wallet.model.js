/*
Wallet {
  userId,
  currentBalance,
  referenceBudget,
  totalIncome,
  totalExpense
}
 */
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'user',
    required: true,
    unique: true
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  referenceBudget: {
    type: Number,
    default: 0
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;