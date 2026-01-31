const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['vacation', 'emergency', 'purchase', 'education', 'investment', 'home', 'car', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
goalSchema.index({ userId: 1, isCompleted: 1 });

// Calculate progress percentage
goalSchema.methods.getProgress = function () {
    return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
};

// Calculate remaining amount
goalSchema.methods.getRemaining = function () {
    return Math.max(this.targetAmount - this.currentAmount, 0);
};

// Calculate days remaining
goalSchema.methods.getDaysRemaining = function () {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Check if on track
goalSchema.methods.isOnTrack = function (avgMonthlySavings) {
    if (this.isCompleted) return true;

    const daysRemaining = this.getDaysRemaining();
    const monthsRemaining = daysRemaining / 30;
    const remaining = this.getRemaining();

    if (monthsRemaining <= 0) return this.currentAmount >= this.targetAmount;

    const requiredMonthlySavings = remaining / monthsRemaining;
    return avgMonthlySavings >= requiredMonthlySavings;
};

// Predict completion date
goalSchema.methods.predictCompletion = function (avgMonthlySavings) {
    if (this.isCompleted) {
        return this.completedAt;
    }

    const remaining = this.getRemaining();

    if (avgMonthlySavings <= 0) {
        return null; // Cannot predict
    }

    const monthsNeeded = Math.ceil(remaining / avgMonthlySavings);
    const now = new Date();
    const predictedDate = new Date(now.setMonth(now.getMonth() + monthsNeeded));

    return predictedDate;
};

module.exports = mongoose.model('Goal', goalSchema, 'goals');
