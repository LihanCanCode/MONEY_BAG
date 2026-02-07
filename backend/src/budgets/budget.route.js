const express = require('express');
const router = express.Router();
const budgetController = require('./budget');
const { verifyFirebaseToken: verifyToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Budget CRUD
router.post('/', budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

// Budget actions
router.patch('/:id/toggle', budgetController.toggleBudget);
router.get('/status', budgetController.getBudgetStatus);
router.get('/analytics', budgetController.getBudgetAnalytics);

module.exports = router;
