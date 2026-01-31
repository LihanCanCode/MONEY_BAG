const express = require('express');
const router = express.Router();
const goalController = require('./goal');
const { verifyFirebaseToken: verifyToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Goal CRUD
router.post('/', goalController.createGoal);
router.get('/', goalController.getGoals);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

// Goal actions
router.post('/:id/contribute', goalController.contributeToGoal);
router.patch('/:id/complete', goalController.completeGoal);
router.get('/:id/predictions', goalController.getGoalPredictions);

module.exports = router;
