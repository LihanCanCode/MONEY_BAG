const Goal = require('./goal.model');
const Transaction = require('../transactions/transaction.model');
const Wallet = require('../wallet/wallet.model');

// Helper function to calculate average monthly savings
async function getAvgMonthlySavings(userId) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
        userId,
        createdAt: { $gte: threeMonthsAgo }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        if (t.type === 'ADD') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    const netSavings = totalIncome - totalExpenses;
    return netSavings / 3; // Average per month
}

// Create goal
exports.createGoal = async (req, res) => {
    try {
        const { name, targetAmount, currentAmount, deadline, category, priority } = req.body;
        const userId = req.user.uid;

        const goal = new Goal({
            userId,
            name,
            targetAmount,
            currentAmount: currentAmount || 0,
            deadline,
            category: category || 'other',
            priority: priority || 'medium'
        });

        await goal.save();

        // Get prediction
        const avgSavings = await getAvgMonthlySavings(userId);
        const prediction = {
            progress: goal.getProgress(),
            remaining: goal.getRemaining(),
            daysRemaining: goal.getDaysRemaining(),
            isOnTrack: goal.isOnTrack(avgSavings),
            predictedCompletion: goal.predictCompletion(avgSavings),
            requiredMonthlySavings: goal.getRemaining() / (goal.getDaysRemaining() / 30)
        };

        res.status(201).json({
            goal,
            prediction
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all goals
exports.getGoals = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { includeCompleted } = req.query;

        const query = { userId };
        if (includeCompleted !== 'true') {
            query.isCompleted = false;
        }

        const goals = await Goal.find(query).sort({ priority: 1, deadline: 1 });
        const avgSavings = await getAvgMonthlySavings(userId);

        const goalsWithPredictions = goals.map(goal => {
            const prediction = {
                progress: goal.getProgress(),
                remaining: goal.getRemaining(),
                daysRemaining: goal.getDaysRemaining(),
                isOnTrack: goal.isOnTrack(avgSavings),
                predictedCompletion: goal.predictCompletion(avgSavings),
                requiredMonthlySavings: goal.getRemaining() / Math.max(goal.getDaysRemaining() / 30, 1)
            };

            return {
                ...goal.toObject(),
                prediction
            };
        });

        res.json(goalsWithPredictions);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update goal
exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const { name, targetAmount, currentAmount, deadline, category, priority } = req.body;

        const goal = await Goal.findOne({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (name) goal.name = name;
        if (targetAmount !== undefined) goal.targetAmount = targetAmount;
        if (currentAmount !== undefined) goal.currentAmount = currentAmount;
        if (deadline) goal.deadline = deadline;
        if (category) goal.category = category;
        if (priority) goal.priority = priority;

        // Check if goal is now completed
        if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
            goal.isCompleted = true;
            goal.completedAt = new Date();
        }

        await goal.save();

        const avgSavings = await getAvgMonthlySavings(userId);
        const prediction = {
            progress: goal.getProgress(),
            remaining: goal.getRemaining(),
            daysRemaining: goal.getDaysRemaining(),
            isOnTrack: goal.isOnTrack(avgSavings),
            predictedCompletion: goal.predictCompletion(avgSavings),
            requiredMonthlySavings: goal.getRemaining() / Math.max(goal.getDaysRemaining() / 30, 1)
        };

        res.json({
            goal,
            prediction
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const goal = await Goal.findOneAndDelete({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Contribute to goal
exports.contributeToGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const userId = req.user.uid;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid contribution amount' });
        }

        const goal = await Goal.findOne({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        // 1. Check and update Wallet
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient wallet balance for this contribution' });
        }

        // Deduct from wallet
        wallet.currentBalance -= amount;
        wallet.totalExpense += amount;
        await wallet.save();

        // 2. Create Transaction history entry
        const transaction = new Transaction({
            userId,
            type: 'SPEND',
            category: 'savings',
            amount,
            message: `Goal Contribution: ${goal.name}`,
            createdAt: new Date()
        });
        await transaction.save();

        // 3. Update Goal
        goal.currentAmount += amount;

        // Check if goal is now completed
        if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
            goal.isCompleted = true;
            goal.completedAt = new Date();
        }

        await goal.save();

        const avgSavings = await getAvgMonthlySavings(userId);
        const prediction = {
            progress: goal.getProgress(),
            remaining: goal.getRemaining(),
            daysRemaining: goal.getDaysRemaining(),
            isOnTrack: goal.isOnTrack(avgSavings),
            predictedCompletion: goal.predictCompletion(avgSavings),
            requiredMonthlySavings: goal.getRemaining() / Math.max(goal.getDaysRemaining() / 30, 1)
        };

        res.json({
            goal,
            prediction,
            transaction,
            walletBalance: wallet.currentBalance,
            message: goal.isCompleted ? 'Congratulations! Goal completed!' : 'Contribution added successfully'
        });
    } catch (error) {
        console.error('Error contributing to goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Complete goal
exports.completeGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const goal = await Goal.findOne({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        goal.isCompleted = true;
        goal.completedAt = new Date();

        // Set current amount to target if not already there
        if (goal.currentAmount < goal.targetAmount) {
            goal.currentAmount = goal.targetAmount;
        }

        await goal.save();

        res.json({
            goal,
            message: 'Congratulations! Goal marked as completed!'
        });
    } catch (error) {
        console.error('Error completing goal:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get goal predictions
exports.getGoalPredictions = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const goal = await Goal.findOne({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const avgSavings = await getAvgMonthlySavings(userId);

        const prediction = {
            progress: goal.getProgress(),
            remaining: goal.getRemaining(),
            daysRemaining: goal.getDaysRemaining(),
            monthsRemaining: goal.getDaysRemaining() / 30,
            isOnTrack: goal.isOnTrack(avgSavings),
            predictedCompletion: goal.predictCompletion(avgSavings),
            requiredMonthlySavings: goal.getRemaining() / Math.max(goal.getDaysRemaining() / 30, 1),
            currentMonthlySavings: avgSavings,
            willMeetDeadline: goal.isOnTrack(avgSavings)
        };

        res.json(prediction);
    } catch (error) {
        console.error('Error fetching goal predictions:', error);
        res.status(500).json({ error: error.message });
    }
};
