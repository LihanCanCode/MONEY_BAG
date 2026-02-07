/*
RecurringTransaction {
  _id,
  userId,
  type,               // ADD | SPEND
  category,           // food, bills, entertainment, salary, etc
  amount,
  message,
  frequency,          // daily, weekly, monthly, yearly
  startDate,          // when the recurring transaction starts
  endDate,            // optional - when to stop
  nextDueDate,        // next date when this should be created
  lastProcessedDate,  // last time a transaction was auto-created
  isActive,           // can pause recurring transactions
  createdAt,
  updatedAt
}
 */
const mongoose = require('mongoose');

const recurringTransactionSchema = new mongoose.Schema({
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
    enum: ['food', 'bills', 'entertainment', 'transport', 'shopping', 'health', 'other', 'education', 'salary', null],
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  lastProcessedDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema, 'recurring_transactions');

module.exports = RecurringTransaction;
