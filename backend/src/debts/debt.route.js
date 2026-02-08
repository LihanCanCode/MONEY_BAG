/**
 * Debt Routes
 * API endpoints for debt management 🎭
 */
const express = require('express');
const router = express.Router();
const debtController = require('./debt');
const { verifyFirebaseToken: verifyToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get debt summary (totals) - must be before /:id routes
router.get('/summary', debtController.getDebtSummary);

// Generate dramatic message
router.post('/dramatic-message', debtController.getDramaticMessage);

// CRUD operations
router.get('/', debtController.getDebts);
router.post('/', debtController.createDebt);
router.put('/:id', debtController.updateDebt);
router.delete('/:id', debtController.resolveDebt);

// Debt amount operations
router.patch('/:id/add', debtController.addToDebt);
router.patch('/:id/subtract', debtController.subtractFromDebt);

module.exports = router;
