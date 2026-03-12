const express = require('express');
const router = express.Router();
const { chatWithCoach } = require('./coach');
const { verifyFirebaseToken: verifyToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// POST /api/coach/chat
router.post('/chat', chatWithCoach);

module.exports = router;
