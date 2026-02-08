/**
 * Debt Model
 * Tracks money owed to/by the user with dramatic flair! 🎭
 */
const mongoose = require('mongoose');

// History entry for tracking all changes to a debt
const historyEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'added', 'subtracted', 'resolved'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const debtSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['owed_to_me', 'i_owe'],
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  dramaLabel: {
    type: String,
    enum: ['trustworthy', 'suspicious', 'always_late', 'doubtful', 'sworn_enemy', 'best_friend', 'family', 'colleague'],
    default: 'trustworthy'
  },
  history: [historyEntrySchema]
}, {
  timestamps: true // Use Mongoose built-in timestamps (createdAt, updatedAt)
});

// Virtual to check if debt is overdue
debtSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.amount > 0;
});

// Ensure virtuals are included in JSON output
debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

const Debt = mongoose.model('Debt', debtSchema, 'debts');

module.exports = Debt;
