const express = require('express');
const router = express.Router();
const {
    getTransactionAnalytics,
    exportTransactionsCSV,
    exportTransactionsPDF,
    getHeatmapData
} = require('./analytics');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(verifyFirebaseToken);

// GET /api/analytics - Get transaction analytics
router.get('/', getTransactionAnalytics);

// GET /api/analytics/export/csv - Export transactions as CSV
router.get('/export/csv', exportTransactionsCSV);

// GET /api/analytics/export/pdf - Export transactions as PDF
router.get('/export/pdf', exportTransactionsPDF);

// GET /api/analytics/heatmap - Get heatmap data
router.get('/heatmap', getHeatmapData);

module.exports = router;
