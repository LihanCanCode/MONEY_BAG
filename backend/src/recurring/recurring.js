const RecurringTransaction = require('./recurring.model');
const Transaction = require('../transactions/transaction.model');
const { updateWallet } = require('../utils/walletHelper');

// Helper function to calculate next due date based on frequency
const calculateNextDueDate = (currentDate, frequency) => {
    const nextDate = new Date(currentDate);

    switch (frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        default:
            nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
};

// Create a new recurring transaction
exports.createRecurringTransaction = async (req, res) => {
    try {
        const { type, category, amount, message, frequency, startDate, endDate } = req.body;
        const userId = req.user.uid;

        // Validate required fields
        if (!type || !amount || !frequency || !startDate) {
            return res.status(400).json({
                success: false,
                message: 'Type, amount, frequency, and start date are required'
            });
        }

        const start = new Date(startDate);
        const nextDue = calculateNextDueDate(start, frequency);

        const recurringTransaction = new RecurringTransaction({
            userId,
            type,
            category: category || null,
            amount,
            message: message || '',
            frequency,
            startDate: start,
            endDate: endDate ? new Date(endDate) : null,
            nextDueDate: nextDue,
            isActive: true
        });

        await recurringTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Recurring transaction created successfully',
            data: recurringTransaction
        });
    } catch (error) {
        console.error('Error creating recurring transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create recurring transaction',
            error: error.message
        });
    }
};

// Get all recurring transactions for a user
exports.getUserRecurringTransactions = async (req, res) => {
    try {
        const userId = req.user.uid;

        const recurringTransactions = await RecurringTransaction.find({ userId })
            .sort({ nextDueDate: 1 });

        res.status(200).json({
            success: true,
            data: recurringTransactions
        });
    } catch (error) {
        console.error('Error fetching recurring transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recurring transactions',
            error: error.message
        });
    }
};

// Update a recurring transaction
exports.updateRecurringTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        const updates = req.body;

        const recurringTransaction = await RecurringTransaction.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!recurringTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Recurring transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recurring transaction updated successfully',
            data: recurringTransaction
        });
    } catch (error) {
        console.error('Error updating recurring transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update recurring transaction',
            error: error.message
        });
    }
};

// Delete a recurring transaction
exports.deleteRecurringTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const recurringTransaction = await RecurringTransaction.findOneAndDelete({
            _id: id,
            userId
        });

        if (!recurringTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Recurring transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recurring transaction deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete recurring transaction',
            error: error.message
        });
    }
};

// Toggle active status of a recurring transaction
exports.toggleRecurringTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        const recurringTransaction = await RecurringTransaction.findOne({
            _id: id,
            userId
        });

        if (!recurringTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Recurring transaction not found'
            });
        }

        recurringTransaction.isActive = !recurringTransaction.isActive;
        await recurringTransaction.save();

        res.status(200).json({
            success: true,
            message: `Recurring transaction ${recurringTransaction.isActive ? 'activated' : 'paused'}`,
            data: recurringTransaction
        });
    } catch (error) {
        console.error('Error toggling recurring transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle recurring transaction',
            error: error.message
        });
    }
};

// Process due recurring transactions (called by cron or manually)
exports.processDueRecurringTransactions = async (req, res) => {
    try {
        const now = new Date();

        // Find all active recurring transactions that are due
        const dueRecurringTransactions = await RecurringTransaction.find({
            isActive: true,
            nextDueDate: { $lte: now },
            $or: [
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        });

        const results = [];

        for (const recurring of dueRecurringTransactions) {
            try {
                // Create the actual transaction
                const transaction = new Transaction({
                    userId: recurring.userId,
                    type: recurring.type,
                    category: recurring.category,
                    amount: recurring.amount,
                    message: `${recurring.message} (Auto-generated)`,
                    createdAt: recurring.nextDueDate
                });

                await transaction.save();

                // Update wallet
                await updateWallet(recurring.userId, recurring.type, recurring.amount);

                // Update recurring transaction
                recurring.lastProcessedDate = recurring.nextDueDate;
                recurring.nextDueDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

                // Deactivate if past end date
                if (recurring.endDate && recurring.nextDueDate > recurring.endDate) {
                    recurring.isActive = false;
                }

                await recurring.save();

                results.push({
                    recurringId: recurring._id,
                    transactionId: transaction._id,
                    success: true
                });
            } catch (error) {
                console.error(`Error processing recurring transaction ${recurring._id}:`, error);
                results.push({
                    recurringId: recurring._id,
                    success: false,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Processed ${results.length} recurring transactions`,
            data: results
        });
    } catch (error) {
        console.error('Error processing recurring transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process recurring transactions',
            error: error.message
        });
    }
};
