const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        enum: ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    period: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    alertThreshold: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
budgetSchema.index({ userId: 1, category: 1 });

// Method to check if budget is exceeded
budgetSchema.methods.checkStatus = function (currentSpending) {
    const percentage = (currentSpending / this.amount) * 100;

    return {
        percentage: Math.round(percentage * 100) / 100,
        status: percentage >= 100 ? 'exceeded' :
            percentage >= this.alertThreshold ? 'warning' :
                'good',
        remaining: this.amount - currentSpending,
        isAlert: percentage >= this.alertThreshold
    };
};

module.exports = mongoose.model('Budget', budgetSchema, 'budgets');
