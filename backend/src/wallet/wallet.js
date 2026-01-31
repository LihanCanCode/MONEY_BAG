const Wallet = require('./wallet.model');
const { getWalletWithTransactions } = require('../utils/walletHelper');

// GET - Get wallet info for a user
const getWallet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const walletData = await getWalletWithTransactions(userId);

    res.status(200).json({
      message: 'Wallet retrieved successfully',
      wallet: walletData
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};

// POST - Add money to wallet
const addMoney = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { amount } = req.body;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = new Wallet({ userId });

    wallet.currentBalance += parseFloat(amount);
    wallet.totalIncome += parseFloat(amount);
    if (wallet.currentBalance > wallet.referenceBudget) wallet.referenceBudget = wallet.currentBalance;

    await wallet.save();
    const walletData = await getWalletWithTransactions(userId);
    res.status(200).json({ message: 'Money added successfully', wallet: walletData });
  } catch (error) {
    res.status(500).json({ message: 'Error adding money', error: error.message });
  }
};

// POST - Spend money from wallet
const spendMoney = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { amount } = req.body;

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (parseFloat(amount) > wallet.currentBalance) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.currentBalance -= parseFloat(amount);
    wallet.totalExpense += parseFloat(amount);

    await wallet.save();
    const walletData = await getWalletWithTransactions(userId);
    res.status(200).json({ message: 'Money spent successfully', wallet: walletData });
  } catch (error) {
    res.status(500).json({ message: 'Error spending money', error: error.message });
  }
};

// POST - Reset wallet to zero
const resetWallet = async (req, res) => {
  try {
    const userId = req.user.uid;
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.currentBalance = 0;
    wallet.referenceBudget = 0;
    await wallet.save();
    const walletData = await getWalletWithTransactions(userId);
    res.status(200).json({ message: 'Wallet reset successfully', wallet: walletData });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting wallet', error: error.message });
  }
};

module.exports = { getWallet, addMoney, spendMoney, resetWallet, getWalletWithTransactions };
