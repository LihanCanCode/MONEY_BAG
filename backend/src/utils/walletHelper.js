const Wallet = require('../wallet/wallet.model');
const Transaction = require('../transactions/transaction.model');

/**
 * Helper to fetch wallet and its transactions in one object
 * @param {string} userId - The Firebase UID of the user
 * @returns {Promise<Object>} The wallet object with transactions array attached
 */
const getWalletWithTransactions = async (userId) => {
    try {
        // Find wallet - use lean for a plain JS object
        let wallet = await Wallet.findOne({ userId }).lean();

        // If no wallet exists, create one
        if (!wallet) {
            console.log(`[WalletHelper] Creating new wallet for user: ${userId}`);
            const newWallet = new Wallet({ userId });
            await newWallet.save();
            wallet = newWallet.toObject();
        }

        // Fetch transactions - use lean for plain JS objects
        console.log(`[WalletHelper] Fetching transactions for user: ${userId}`);
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`[WalletHelper] Found ${transactions.length} transactions for user: ${userId}`);

        // Return merged object
        return {
            ...wallet,
            transactions: transactions || []
        };
    } catch (error) {
        console.error(`[WalletHelper] Error:`, error);
        throw error;
    }
};

module.exports = { getWalletWithTransactions };
