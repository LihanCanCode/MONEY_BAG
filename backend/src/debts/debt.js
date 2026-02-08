/**
 * Debt Controller
 * Handles all debt-related operations with wallet integration 🎭💰
 */
const Debt = require('./debt.model');
const Wallet = require('../wallet/wallet.model');
const Transaction = require('../transactions/transaction.model');
const { generateDramaticMessage } = require('../utils/geminiParser');

/**
 * Helper: Update wallet and create transaction
 */
const updateWalletAndCreateTransaction = async (userId, amount, type, message) => {
  // Find or create wallet
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId, currentBalance: 0, totalIncome: 0, totalExpense: 0 });
  }

  console.log(`[DEBT] Before update - User: ${userId}, Balance: ${wallet.currentBalance}, Type: ${type}, Amount: ${amount}`);

  // Update balance based on transaction type
  if (type === 'ADD') {
    wallet.currentBalance += amount;
    wallet.totalIncome += amount;
  } else {
    wallet.currentBalance -= amount;
    wallet.totalExpense += amount;
  }
  
  console.log(`[DEBT] After update - New Balance: ${wallet.currentBalance}`);
  
  await wallet.save();
  
  console.log(`[DEBT] Wallet saved successfully`);

  // Create transaction record
  const transaction = new Transaction({
    userId,
    type,
    category: 'debt',
    amount,
    message,
    satisfactionScore: null
  });
  await transaction.save();
  
  console.log(`[DEBT] Transaction created: ${type} $${amount} - ${message}`);

  return { wallet, transaction };
};

/**
 * Helper: Check if user has sufficient balance
 */
const checkSufficientBalance = async (userId, amount) => {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) return false;
  return wallet.currentBalance >= amount;
};

/**
 * Create a new debt entry
 * - owed_to_me: User lent money → SPEND (deduct from wallet)
 * - i_owe: User borrowed money → ADD (add to wallet)
 */
exports.createDebt = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { personName, amount, description, type, dueDate, dramaLabel } = req.body;

    // Validate required fields
    if (!personName || !amount || !type) {
      return res.status(400).json({ error: 'Person name, amount, and type are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check for sufficient balance when lending money (owed_to_me)
    if (type === 'owed_to_me') {
      const hasSufficientBalance = await checkSufficientBalance(userId, amount);
      if (!hasSufficientBalance) {
        return res.status(400).json({ 
          error: `🚫 HALT! Your coffers run dry! You cannot lend $${amount} when your treasury lacks the funds. The sacred pact cannot be sealed! 💸`
        });
      }
    }

    // Create debt entry
    const debt = new Debt({
      userId,
      personName,
      amount,
      description: description || '',
      type,
      dueDate: dueDate || null,
      dramaLabel: dramaLabel || 'trustworthy',
      history: [{
        action: 'created',
        amount,
        note: description || 'Initial debt created'
      }]
    });

    await debt.save();

    // Update wallet based on debt type
    const transactionType = type === 'owed_to_me' ? 'SPEND' : 'ADD';
    const transactionMessage = type === 'owed_to_me'
      ? `Lent $${amount} to ${personName}`
      : `Borrowed $${amount} from ${personName}`;

    await updateWalletAndCreateTransaction(userId, amount, transactionType, transactionMessage);

    res.status(201).json({
      debt: debt.toObject(),
      message: type === 'owed_to_me'
        ? `A sacred financial pact has been sealed with ${personName}! 📜✨`
        : `${personName} has bestowed upon you the sacred sum! 💰🎭`
    });
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all debts for a user
 */
exports.getDebts = async (req, res) => {
  try {
    const userId = req.user.uid;
    const debts = await Debt.find({ userId }).sort({ createdAt: -1 });

    // Add isOverdue virtual for each debt
    const debtsWithOverdue = debts.map(debt => ({
      ...debt.toObject(),
      isOverdue: debt.isOverdue
    }));

    res.json(debtsWithOverdue);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get debt summary (totals)
 */
exports.getDebtSummary = async (req, res) => {
  try {
    const userId = req.user.uid;
    const debts = await Debt.find({ userId });

    const summary = {
      totalOwedToMe: 0,
      totalIOwe: 0,
      owedToMeCount: 0,
      iOweCount: 0,
      overdueCount: 0
    };

    debts.forEach(debt => {
      if (debt.type === 'owed_to_me') {
        summary.totalOwedToMe += debt.amount;
        summary.owedToMeCount++;
      } else {
        summary.totalIOwe += debt.amount;
        summary.iOweCount++;
      }
      if (debt.isOverdue) {
        summary.overdueCount++;
      }
    });

    summary.netBalance = summary.totalOwedToMe - summary.totalIOwe;

    res.json(summary);
  } catch (error) {
    console.error('Error fetching debt summary:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add more to an existing debt
 * - owed_to_me: User lent more money → SPEND
 * - i_owe: User borrowed more money → ADD
 */
exports.addToDebt = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    // Check for sufficient balance when lending more money (owed_to_me)
    if (debt.type === 'owed_to_me') {
      const hasSufficientBalance = await checkSufficientBalance(userId, amount);
      if (!hasSufficientBalance) {
        return res.status(400).json({ 
          error: `🚫 HALT! Your coffers run dry! You cannot lend $${amount} more when your treasury lacks the funds! 💸`
        });
      }
    }

    // Add to debt amount
    debt.amount += amount;
    debt.history.push({
      action: 'added',
      amount,
      note: note || 'Additional amount added'
    });

    await debt.save();

    // Update wallet
    const transactionType = debt.type === 'owed_to_me' ? 'SPEND' : 'ADD';
    const transactionMessage = debt.type === 'owed_to_me'
      ? `Lent additional $${amount} to ${debt.personName}`
      : `Borrowed additional $${amount} from ${debt.personName}`;

    await updateWalletAndCreateTransaction(userId, amount, transactionType, transactionMessage);

    res.json({
      debt: debt.toObject(),
      message: `The debt grows... the plot thickens! 🎭📈 (+$${amount})`
    });
  } catch (error) {
    console.error('Error adding to debt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Subtract from an existing debt (partial payment)
 * - owed_to_me: Someone paid back → ADD (money comes back to user)
 * - i_owe: User paid back → SPEND (money leaves user)
 */
exports.subtractFromDebt = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    if (amount > debt.amount) {
      return res.status(400).json({ error: 'Amount exceeds current debt' });
    }

    // Check for sufficient balance when paying back money (i_owe)
    if (debt.type === 'i_owe') {
      const hasSufficientBalance = await checkSufficientBalance(userId, amount);
      if (!hasSufficientBalance) {
        return res.status(400).json({ 
          error: `🚫 HALT! Your coffers run dry! You cannot pay back $${amount} when your treasury lacks the funds! Honor your debts when gold flows again! 💸`
        });
      }
    }

    // Subtract from debt amount
    debt.amount -= amount;
    debt.history.push({
      action: 'subtracted',
      amount,
      note: note || 'Partial payment received'
    });

    await debt.save();

    // Update wallet (reverse of add logic)
    const transactionType = debt.type === 'owed_to_me' ? 'ADD' : 'SPEND';
    const transactionMessage = debt.type === 'owed_to_me'
      ? `Received $${amount} payment from ${debt.personName}`
      : `Paid back $${amount} to ${debt.personName}`;

    await updateWalletAndCreateTransaction(userId, amount, transactionType, transactionMessage);

    res.json({
      debt: debt.toObject(),
      message: `A small victory! The debt shrinks... 💫✨ (-$${amount})`
    });
  } catch (error) {
    console.error('Error subtracting from debt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolve/clear a debt completely
 * - owed_to_me: Full payment received → ADD remaining amount
 * - i_owe: Full payment made → SPEND remaining amount
 */
exports.resolveDebt = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    const remainingAmount = debt.amount;
    const personName = debt.personName;
    const debtType = debt.type;

    // Check for sufficient balance when fully paying back money (i_owe)
    if (debtType === 'i_owe' && remainingAmount > 0) {
      const hasSufficientBalance = await checkSufficientBalance(userId, remainingAmount);
      if (!hasSufficientBalance) {
        return res.status(400).json({ 
          error: `🚫 HALT! Your coffers run dry! You cannot fully repay $${remainingAmount} when your treasury lacks the funds! The chains of debt remain unbroken! ⛓️💸`
        });
      }
    }

    // If there's remaining amount, update wallet
    if (remainingAmount > 0) {
      const transactionType = debtType === 'owed_to_me' ? 'ADD' : 'SPEND';
      const transactionMessage = debtType === 'owed_to_me'
        ? `${personName} fully repaid debt of $${remainingAmount}`
        : `Fully repaid debt of $${remainingAmount} to ${personName}`;

      await updateWalletAndCreateTransaction(userId, remainingAmount, transactionType, transactionMessage);
    }

    // Delete the debt
    await Debt.findByIdAndDelete(id);

    res.json({
      message: `THE PROPHECY IS FULFILLED! 🎉✨ The debt with ${personName} has been resolved!`,
      resolvedAmount: remainingAmount,
      personName
    });
  } catch (error) {
    console.error('Error resolving debt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update debt details (not amount - use add/subtract for that)
 */
exports.updateDebt = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { personName, description, dueDate, dramaLabel } = req.body;

    const debt = await Debt.findOne({ _id: id, userId });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    if (personName) debt.personName = personName;
    if (description !== undefined) debt.description = description;
    if (dueDate !== undefined) debt.dueDate = dueDate;
    if (dramaLabel) debt.dramaLabel = dramaLabel;

    await debt.save();

    res.json({
      debt: debt.toObject(),
      message: 'Debt details updated successfully'
    });
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate a dramatic message using Gemini AI
 */
exports.getDramaticMessage = async (req, res) => {
  try {
    const { action, personName, amount, dramaLabel } = req.body;

    // Use Gemini to generate a dramatic message
    const message = await generateDramaticMessage(action, personName, amount, dramaLabel);

    res.json({ message });
  } catch (error) {
    console.error('Error generating dramatic message:', error);
    // Fallback messages if Gemini fails
    const fallbackMessages = {
      create_owed: `A sacred pact formed! ${personName} now owes you $${amount}! 📜`,
      create_owe: `You've accepted ${personName}'s generous offering of $${amount}! 💰`,
      add: `The debt deepens... $${amount} more added to the ledger! 📈`,
      subtract: `Progress! $${amount} struck from the ancient debt! ⚔️`,
      resolve: `FREEDOM! The debt chains are broken! 🎉`
    };
    res.json({ message: fallbackMessages[action] || 'The deed is done! 🎭' });
  }
};
