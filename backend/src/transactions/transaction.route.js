const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createTransaction, getUserTransactions, clearAllTransactions } = require('./transactions');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');
const { parseTransactionText, parseReceiptImage, fancyMessage } = require('../utils/geminiParser');

// Configure multer for receipt image uploads (using memory storage)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

router.use(verifyFirebaseToken);
// POST /api/transactions/parse-ai - Parse natural language transaction with Gemini AI (NO AUTH for testing)
router.post('/parse-ai', async (req, res) => {
  try {
    console.log('=== AI Parse Request Received ===');
    console.log('Request body:', req.body);

    const { text } = req.body;

    // Validate that text is provided
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('Validation failed: text is empty or invalid');
      return res.status(400).json({
        message: "Text is required and must be a non-empty string"
      });
    }

    console.log('Calling Gemini AI with text:', text);

    // Call Gemini AI to parse the transaction text
    const extractedData = await parseTransactionText(text.trim());

    console.log('AI Response:', extractedData);

    // Return the extracted data to frontend for user verification
    res.status(200).json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('=== AI Parsing Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: "AI Parsing failed",
      error: error.message
    });
  }
});
router.post('/fancy-popup', async (req, res) => {
  try {
    const { amount, category } = req.body;
    const extractedData = await fancyMessage(amount, category);
    res.status(200).json({
      message: extractedData
    })





  } catch (error) {
    res.status(401).json({
      message: "Fancy fall hoie giyeche"
    })

  }
});
// POST /api/transactions/parse-receipt - Parse receipt image with Gemini AI Vision
router.post('/parse-receipt', upload.single('receipt'), async (req, res) => {
  try {
    console.log('=== Receipt Parse Request Received ===');
    console.log('File info:', {
      filename: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });

    // Validate that file was uploaded
    if (!req.file || !req.file.buffer) {
      console.log('Validation failed: no file uploaded');
      return res.status(400).json({
        success: false,
        message: "Receipt image is required"
      });
    }

    console.log('Receipt image received in memory, size:', req.file.size, 'bytes');
    console.log('Calling Gemini AI Vision to parse receipt...');

    // Call Gemini AI Vision to parse the receipt image
    const extractedData = await parseReceiptImage(req.file.buffer, req.file.mimetype);

    console.log('Vision AI Response:', extractedData);

    // Return the extracted data to frontend for user verification
    res.status(200).json({
      success: true,
      data: extractedData,
      message: 'Receipt scanned successfully'
    });

  } catch (error) {
    console.error('=== Receipt Parsing Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      success: false,
      message: "Receipt parsing failed",
      error: error.message
    });
  }
});

// POST /api/transactions - Create a new transaction
router.post('/', createTransaction);

// GET /api/transactions - Get all transactions for authenticated user
router.get('/', getUserTransactions);

// DELETE /api/transactions - Clear all transactions for authenticated user
router.delete('/', clearAllTransactions);

module.exports = router;

