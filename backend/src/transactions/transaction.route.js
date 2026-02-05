const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createTransaction, getUserTransactions, clearAllTransactions } = require('./transactions');
const Transaction = require('./transaction.model');
const Wallet = require('../wallet/wallet.model');
const { getWalletWithTransactions } = require('../utils/walletHelper');
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

    // 1. Call Gemini AI to parse the transaction text
    const extractedData = await parseTransactionText(text.trim());
    console.log('AI Response:', extractedData);

    if (!extractedData.amount) {
      return res.status(400).json({
        success: false,
        message: "AI couldn't find an amount. Please specify clearly (e.g., 'Spent 50 on lunch')"
      });
    }

    // 2. Create the transaction in database
    const userId = req.user.uid;
    const amount = parseFloat(extractedData.amount);

    if (isNaN(amount)) {
      throw new Error("AI returned an invalid amount: " + extractedData.amount);
    }

    // 3. Update wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      console.log(`[AI Parse] Creating new wallet for ${userId}`);
      wallet = new Wallet({ userId });
    }

    console.log(`[AI Parse] Old Balance: ${wallet.currentBalance}, Amount: ${amount}`);

    const newTransaction = new Transaction({
      userId,
      type: extractedData.type === 'income' ? 'ADD' : 'SPEND',
      category: extractedData.category || (extractedData.type === 'income' ? null : 'other'),
      amount: amount,
      message: extractedData.description,
      createdAt: new Date()
    });
    await newTransaction.save();

    if (newTransaction.type === 'ADD') {
      wallet.currentBalance += amount;
      wallet.totalIncome += amount;
    } else {
      wallet.currentBalance -= amount;
      wallet.totalExpense += amount;
    }
    await wallet.save();
    console.log(`[AI Parse] New Balance: ${wallet.currentBalance}`);

    // 4. Return updated wallet
    const walletData = await getWalletWithTransactions(userId);

    res.status(200).json({
      success: true,
      transaction: newTransaction,
      wallet: walletData,
      message: 'AI successfully recorded transaction'
    });
  } catch (error) {
    console.error('=== AI Parsing Error ===');
    console.error(error);
    res.status(500).json({
      success: false,
      message: "AI extraction failed: " + error.message
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

    // 1. Call Gemini AI Vision to parse the receipt image
    const extractedData = await parseReceiptImage(req.file.buffer, req.file.mimetype);
    console.log('Vision AI Response:', extractedData);

    if (!extractedData.amount) {
      return res.status(400).json({
        success: false,
        message: "Vision AI couldn't read the amount. Please ensure the total is clear."
      });
    }

    // 2. Create the transaction
    const userId = req.user.uid;
    const amount = parseFloat(extractedData.amount);

    if (isNaN(amount)) {
      throw new Error("Vision AI returned an invalid amount: " + extractedData.amount);
    }

    const newTransaction = new Transaction({
      userId,
      type: 'SPEND',
      category: extractedData.category || 'other',
      amount: amount,
      message: extractedData.description,
      createdAt: extractedData.date ? new Date(extractedData.date) : new Date()
    });
    await newTransaction.save();

    // 3. Update wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId });

    console.log(`[Vision AI] Deducting ${amount} from ${wallet.currentBalance}`);
    wallet.currentBalance -= amount;
    wallet.totalExpense += amount;
    await wallet.save();

    // 4. Return updated wallet
    const walletData = await getWalletWithTransactions(userId);

    res.status(200).json({
      success: true,
      transaction: newTransaction,
      wallet: walletData,
      message: 'Receipt scanned and recorded successfully'
    });

  } catch (error) {
    console.error('=== Receipt Parsing Error ===');
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Receipt scanning failed: " + error.message
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

