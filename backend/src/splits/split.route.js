const express = require('express');
const router = express.Router();
const {
  createSplit,
  getSplits,
  getSplitSummary,
  getSplitById,
  updateSplit,
  deleteSplit,
  settleParticipant,
  partialPayment,
  treatParticipant
} = require('./split');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyFirebaseToken);

// Named routes before parameterized routes
// GET /api/splits/summary — Get summary stats
router.get('/summary', getSplitSummary);

// CRUD on /
router.post('/', createSplit);
router.get('/', getSplits);

// CRUD on /:id
router.get('/:id', getSplitById);
router.put('/:id', updateSplit);
router.delete('/:id', deleteSplit);

// Sub-actions on a participant
router.patch('/:id/partial/:participantId', partialPayment);
router.patch('/:id/treat/:participantId', treatParticipant);

// Sub-action: settle a participant
router.patch('/:id/settle/:participantId', settleParticipant);

module.exports = router;
