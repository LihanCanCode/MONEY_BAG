const Budget = require('./budget.model');
const Transaction = require('../transactions/transaction.model');

// Helper function to get current period spending
async function getCurrentSpending(userId, category, period = 'monthly') {
    const now = new Date();
    let startDate;

    if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const transactions = await Transaction.find({
        userId,
        category,
        type: 'SPEND',
        createdAt: { $gte: startDate, $lte: now }
    });

    return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Create budget
exports.createBudget = async (req, res) => {
    try {
        const { category, amount, period, alertThreshold } = req.body;
        const userId = req.user.uid;

        // Check if budget already exists for this category
        const existingBudget = await Budget.findOne({ userId, category, isActive: true });
        if (existingBudget) {
            return res.status(400).json({
                error: 'Budget already exists for this category. Please update the existing one.'
            });
        }

        const budget = new Budget({
            userId,
            category,
            amount,
            period: period || 'monthly',
            alertThreshold: alertThreshold || 80,
            startDate: new Date()
        });

        await budget.save();

        // Get current spending for the budget
        const currentSpending = await getCurrentSpending(userId, category, budget.period);
        const status = budget.checkStatus(currentSpending);

        res.status(201).json({
            budget,
            currentSpending,
            status
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all budgets
exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.uid;
        const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });

        // Get current spending for each budget
        const budgetsWithStatus = await Promise.all(
            budgets.map(async (budget) => {
                const currentSpending = await getCurrentSpending(userId, budget.category, budget.period);
                const status = budget.checkStatus(currentSpending);

                return {
                    ...budget.toObject(),
                    currentSpending,
                    status
                };
            })
        );

        res.json(budgetsWithStatus);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update budget
exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const { category, amount, period, alertThreshold, isActive } = req.body;

        const budget = await Budget.findOne({ _id: id, userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        if (category) budget.category = category;
        if (amount !== undefined) budget.amount = amount;
        if (period) budget.period = period;
        if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
        if (isActive !== undefined) budget.isActive = isActive;

        await budget.save();

        const currentSpending = await getCurrentSpending(userId, budget.category, budget.period);
        const status = budget.checkStatus(currentSpending);

        res.json({
            budget,
            currentSpending,
            status
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const budget = await Budget.findOneAndDelete({ _id: id, userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: error.message });
    }
};

// Toggle budget active status
exports.toggleBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const budget = await Budget.findOne({ _id: id, userId });
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        budget.isActive = !budget.isActive;
        await budget.save();

        const currentSpending = await getCurrentSpending(userId, budget.category, budget.period);
        const status = budget.checkStatus(currentSpending);

        res.json({
            budget,
            currentSpending,
            status
        });
    } catch (error) {
        console.error('Error toggling budget:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get budget status and alerts
exports.getBudgetStatus = async (req, res) => {
    try {
        const userId = req.user.uid;
        const budgets = await Budget.find({ userId, isActive: true });

        const alerts = [];
        let totalBudget = 0;
        let totalSpent = 0;

        for (const budget of budgets) {
            const currentSpending = await getCurrentSpending(userId, budget.category, budget.period);
            const status = budget.checkStatus(currentSpending);

            totalBudget += budget.amount;
            totalSpent += currentSpending;

            if (status.isAlert) {
                alerts.push({
                    budgetId: budget._id,
                    category: budget.category,
                    amount: budget.amount,
                    spent: currentSpending,
                    percentage: status.percentage,
                    status: status.status
                });
            }
        }

        res.json({
            totalBudget,
            totalSpent,
            overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
            alerts,
            alertCount: alerts.length
        });
    } catch (error) {
        console.error('Error fetching budget status:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get budget analytics (budget vs actual)
exports.getBudgetAnalytics = async (req, res) => {
    try {
        const userId = req.user.uid;
        const budgets = await Budget.find({ userId, isActive: true });

        const analytics = await Promise.all(
            budgets.map(async (budget) => {
                const currentSpending = await getCurrentSpending(userId, budget.category, budget.period);

                return {
                    category: budget.category,
                    budgeted: budget.amount,
                    actual: currentSpending,
                    difference: budget.amount - currentSpending,
                    percentage: Math.round((currentSpending / budget.amount) * 100)
                };
            })
        );

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching budget analytics:', error);
        res.status(500).json({ error: error.message });
    }
};
