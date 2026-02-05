const Transaction = require('./transaction.model');
const Wallet = require('../wallet/wallet.model');
const { getWalletWithTransactions } = require('../utils/walletHelper');

// POST - Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { type, category, amount, satisfactionScore, message } = req.body;

    // Validate required fields
    if (!type || !amount) {
      return res.status(400).json({
        message: 'type and amount are required'
      });
    }

    // Validate type
    if (!['ADD', 'SPEND'].includes(type)) {
      return res.status(400).json({
        message: 'type must be either ADD or SPEND'
      });
    }

    // Create new transaction record
    const newTransaction = new Transaction({
      userId,
      type,
      category: type === 'ADD' ? null : category,
      amount: parseFloat(amount),
      satisfactionScore,
      message
    });

    await newTransaction.save();
    console.log(`[Transactions] Saved new transaction for user: ${userId}`);

    // Update wallet summary info
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId });
    }

    if (type === 'ADD') {
      wallet.currentBalance += parseFloat(amount);
      wallet.totalIncome += parseFloat(amount);
      if (wallet.currentBalance > wallet.referenceBudget) wallet.referenceBudget = wallet.currentBalance;
    } else {
      wallet.currentBalance -= parseFloat(amount);
      wallet.totalExpense += parseFloat(amount);
    }

    await wallet.save();
    console.log(`[Transactions] Updated wallet summary for user: ${userId}`);

    // Fetch refreshed wallet with all transactions for the response
    const walletData = await getWalletWithTransactions(userId);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: newTransaction,
      wallet: walletData
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// GET - Get all transactions for a user with search and filters
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      search,           // text search in message
      category,         // filter by category
      type,             // filter by type (ADD/SPEND)
      minAmount,        // minimum amount
      maxAmount,        // maximum amount
      startDate,        // start date
      endDate,          // end date
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };

    // Text search in message field
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const transactions = await Transaction.find(query)
      .sort(sortConfig)
      .lean();

    res.status(200).json({
      message: 'Transactions retrieved successfully',
      count: transactions.length,
      transactions: transactions,
      filters: { search, category, type, minAmount, maxAmount, startDate, endDate }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// DELETE - Clear all transactions for a user
const clearAllTransactions = async (req, res) => {
  try {
    const userId = req.user.uid;
    await Transaction.deleteMany({ userId });

    res.status(200).json({
      message: 'All transactions cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing transactions:', error);
    res.status(500).json({
      message: 'Error clearing transactions',
      error: error.message
    });
  }
};

module.exports = { createTransaction, getUserTransactions, clearAllTransactions };