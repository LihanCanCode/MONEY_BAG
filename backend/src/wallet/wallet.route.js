const express = require('express');
const router = express.Router();
const { getWallet, addMoney, spendMoney, resetWallet } = require('./wallet');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /api/wallet - Get wallet info for authenticated user
router.get('/', getWallet);
//these add monet and spend money is redundant , we use transaction routes instead 
// POST /api/wallet/add - Add money to wallet
router.post('/add', addMoney);

// POST /api/wallet/spend - Spend money from wallet
router.post('/spend', spendMoney);

// POST /api/wallet/reset - Reset wallet to zero
router.post('/reset', resetWallet);

module.exports = router;