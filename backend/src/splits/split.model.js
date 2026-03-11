/*
Split {
  _id,
  userId,             // creator (who paid the full bill)
  title,              // name of the shared expense
  totalAmount,        // full bill amount
  category,           // food, bills, travel, entertainment, shopping, other
  splitMethod,        // equal, custom, percentage
  date,               // when the expense happened
  note,               // optional description
  participants,       // array of people and their shares
  transactionId,      // reference to the auto-created SPEND transaction
  isSettled,          // true when all participants have paid
  createdAt,
  updatedAt
}
*/
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  isTreated: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { _id: true });

const splitSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['food', 'bills', 'travel', 'entertainment', 'shopping', 'other'],
    default: 'other'
  },
  splitMethod: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  },
  userShare: {
    type: Number,
    default: 0,
    min: 0
  },
  participants: [participantSchema],
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  isSettled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: how many participants have paid
splitSchema.virtual('paidCount').get(function () {
  return this.participants.filter(p => p.isPaid).length;
});

// Virtual: total amount still owed
splitSchema.virtual('owedAmount').get(function () {
  return this.participants.filter(p => !p.isPaid).reduce((sum, p) => sum + p.amount, 0);
});

const Split = mongoose.model('Split', splitSchema, 'splits');

module.exports = Split;
