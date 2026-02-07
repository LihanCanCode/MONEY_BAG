const express = require('express');
const router = express.Router();
const {
    createRecurringTransaction,
    getUserRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processDueRecurringTransactions
} = require('./recurring');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyFirebaseToken);

// POST /api/recurring - Create a new recurring transaction
router.post('/', createRecurringTransaction);

// GET /api/recurring - Get all recurring transactions for user
router.get('/', getUserRecurringTransactions);

// PUT /api/recurring/:id - Update a recurring transaction
router.put('/:id', updateRecurringTransaction);

// DELETE /api/recurring/:id - Delete a recurring transaction
router.delete('/:id', deleteRecurringTransaction);

// PATCH /api/recurring/:id/toggle - Toggle active status
router.patch('/:id/toggle', toggleRecurringTransaction);

// POST /api/recurring/process - Process all due recurring transactions
router.post('/process', processDueRecurringTransactions);

module.exports = router;
