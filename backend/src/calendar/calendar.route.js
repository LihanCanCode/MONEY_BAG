const express = require('express');
const router = express.Router();
const { getCalendarEvents } = require('./calendar');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /api/calendar/events - Get all financial events for a date range
router.get('/events', getCalendarEvents);

module.exports = router;
