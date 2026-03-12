/**
 * Split Bills Controller
 * Handles all split-related operations with wallet integration and dramatic AI messages 🍕💸
 */
const Split = require('./split.model');
const Wallet = require('../wallet/wallet.model');
const Transaction = require('../transactions/transaction.model');
const { generateSplitMessage } = require('../utils/geminiParser');

/**
 * Helper: Update wallet and create transaction record
 */
const updateWalletAndCreateTransaction = async (userId, amount, type, message) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = new Wallet({ userId, currentBalance: 0, totalIncome: 0, totalExpense: 0 });
  }

  if (type === 'ADD') {
    wallet.currentBalance += amount;
    wallet.totalIncome += amount;
  } else {
    wallet.currentBalance -= amount;
    wallet.totalExpense += amount;
  }

  await wallet.save();

  const transaction = new Transaction({
    userId,
    type,
    category: type === 'SPEND' ? 'other' : null,
    amount,
    message,
    satisfactionScore: null
  });
  await transaction.save();

  console.log(`[SPLIT] ${type} ৳${amount} — ${message}`);
  return { wallet, transaction };
};

/**
 * Create a new split
 */
exports.createSplit = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, totalAmount, category, splitMethod, date, note, participants } = req.body;

    // Validate
    if (!title || !totalAmount || !participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, total amount, and at least one participant are required'
      });
    }

    // Validate participant shares add up (for custom/percentage)
    const participantShares = participants.map(p => ({
      name: p.name.trim(),
      amount: parseFloat(p.amount),
      isPaid: false,
      paidAt: null
    }));

    const sharesSum = participantShares.reduce((sum, p) => sum + p.amount, 0);
    const total = parseFloat(totalAmount);

    // Participants' shares must not exceed the total (the remainder is the user's own share)
    if (sharesSum > total + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Participant shares (৳${sharesSum.toFixed(2)}) exceed the total (৳${total.toFixed(2)})`
      });
    }

    // Debit wallet for the full bill amount (you paid the whole thing)
    const { transaction } = await updateWalletAndCreateTransaction(
      userId,
      total,
      'SPEND',
      `Split bill: ${title}`
    );

    // Compute user's own share (total - what participants owe)
    const userShare = Math.round((total - sharesSum) * 100) / 100;

    // Create the split
    const split = new Split({
      userId,
      title,
      totalAmount: total,
      category: category || 'other',
      splitMethod: splitMethod || 'equal',
      date: date ? new Date(date) : new Date(),
      note: note || '',
      userShare,
      participants: participantShares,
      transactionId: transaction._id,
      isSettled: false
    });

    await split.save();

    // Generate dramatic AI message
    let dramaticMessage = '';
    try {
      const names = participantShares.map(p => p.name).join(', ');
      dramaticMessage = await generateSplitMessage(
        'create',
        title,
        total,
        participantShares.length,
        names
      );
    } catch (err) {
      console.error('[SPLIT] AI message failed, using fallback');
      dramaticMessage = `💸 The bill of ৳${total.toFixed(2)} has been split among ${participantShares.length} people. May they all pay their share! 🍕`;
    }

    res.status(201).json({
      success: true,
      message: 'Split created successfully',
      data: split,
      dramaticMessage
    });
  } catch (error) {
    console.error('Error creating split:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create split',
      error: error.message
    });
  }
};

/**
 * Get all splits for the user
 */
exports.getSplits = async (req, res) => {
  try {
    const userId = req.user.uid;
    const splits = await Split.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: splits
    });
  } catch (error) {
    console.error('Error fetching splits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch splits',
      error: error.message
    });
  }
};

/**
 * Get split summary (total owed, active count)
 */
exports.getSplitSummary = async (req, res) => {
  try {
    const userId = req.user.uid;
    const splits = await Split.find({ userId, isSettled: false });

    let totalOwed = 0;
    let activeSplits = splits.length;

    for (const split of splits) {
      for (const p of split.participants) {
        if (!p.isPaid) {
          totalOwed += p.amount;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalOwed,
        activeSplits
      }
    });
  } catch (error) {
    console.error('Error fetching split summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch split summary',
      error: error.message
    });
  }
};

/**
 * Get a single split by ID
 */
exports.getSplitById = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({
        success: false,
        message: 'Split not found'
      });
    }

    res.status(200).json({
      success: true,
      data: split
    });
  } catch (error) {
    console.error('Error fetching split:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch split',
      error: error.message
    });
  }
};

/**
 * Update a split (title, note, date, participants)
 */
exports.updateSplit = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const updates = req.body;

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({
        success: false,
        message: 'Split not found'
      });
    }

    if (split.isSettled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a fully settled split'
      });
    }

    // Apply allowed updates
    if (updates.title) split.title = updates.title;
    if (updates.note !== undefined) split.note = updates.note;
    if (updates.date) split.date = new Date(updates.date);
    if (updates.category) split.category = updates.category;

    await split.save();

    res.status(200).json({
      success: true,
      message: 'Split updated successfully',
      data: split
    });
  } catch (error) {
    console.error('Error updating split:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update split',
      error: error.message
    });
  }
};

/**
 * Delete a split — refund the un-recovered portion back to wallet
 */
exports.deleteSplit = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({
        success: false,
        message: 'Split not found'
      });
    }

    // Calculate how much was already recovered via settlements (not treats — those had no wallet credit)
    const recoveredAmount = split.participants
      .filter(p => p.isPaid && !p.isTreated)
      .reduce((sum, p) => sum + p.amount, 0);

    // Refund = total bill minus what participants already paid back
    const refundAmount = Math.round((split.totalAmount - recoveredAmount) * 100) / 100;

    if (refundAmount > 0) {
      await updateWalletAndCreateTransaction(
        userId,
        refundAmount,
        'ADD',
        `Refund from deleted split: ${split.title}`
      );
    }

    await Split.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Split deleted — ৳${refundAmount.toFixed(2)} refunded to wallet`
    });
  } catch (error) {
    console.error('Error deleting split:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete split',
      error: error.message
    });
  }
};

/**
 * Mark a participant as paid (settle their share)
 */
exports.settleParticipant = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id, participantId } = req.params;

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({
        success: false,
        message: 'Split not found'
      });
    }

    const participant = split.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    if (participant.isPaid) {
      return res.status(400).json({
        success: false,
        message: `${participant.name} has already paid`
      });
    }

    // Mark participant as paid
    participant.isPaid = true;
    participant.paidAt = new Date();

    // Credit wallet (they paid you back)
    await updateWalletAndCreateTransaction(
      userId,
      participant.amount,
      'ADD',
      `${participant.name} paid back — ${split.title}`
    );

    // Check if all participants are now paid
    const allPaid = split.participants.every(p => p.isPaid);
    if (allPaid) {
      split.isSettled = true;
    }

    await split.save();

    // Generate dramatic AI message
    let dramaticMessage = '';
    try {
      const action = allPaid ? 'settle_all' : 'settle_one';
      dramaticMessage = await generateSplitMessage(
        action,
        split.title,
        participant.amount,
        split.participants.length,
        participant.name
      );
    } catch (err) {
      console.error('[SPLIT] AI message failed, using fallback');
      if (allPaid) {
        dramaticMessage = `🎉 THE SPLIT IS SETTLED! Everyone has paid their share for "${split.title}"! 🏆`;
      } else {
        dramaticMessage = `✅ ${participant.name} paid back ৳${participant.amount.toFixed(2)}! 💰`;
      }
    }

    res.status(200).json({
      success: true,
      message: `${participant.name} marked as paid`,
      data: split,
      allSettled: allPaid,
      dramaticMessage
    });
  } catch (error) {
    console.error('Error settling participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle participant',
      error: error.message
    });
  }
};

/**
 * Partial payment — reduce a participant's owed amount
 */
exports.partialPayment = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id, participantId } = req.params;
    const { amount } = req.body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({ success: false, message: 'Split not found' });
    }

    const participant = split.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    if (participant.isPaid) {
      return res.status(400).json({ success: false, message: `${participant.name} has already fully paid` });
    }

    if (payAmount > participant.amount + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Amount (৳${payAmount.toFixed(2)}) exceeds what ${participant.name} owes (৳${participant.amount.toFixed(2)})`
      });
    }

    // Credit wallet for the partial payment
    await updateWalletAndCreateTransaction(
      userId,
      payAmount,
      'ADD',
      `${participant.name} partially paid — ${split.title}`
    );

    // Reduce owed amount
    const remaining = Math.round((participant.amount - payAmount) * 100) / 100;

    // If remaining is effectively zero, mark as fully paid
    if (remaining <= 0.01) {
      participant.amount = 0;
      participant.isPaid = true;
      participant.paidAt = new Date();
    } else {
      participant.amount = remaining;
    }

    // Check if all settled
    const allPaid = split.participants.every(p => p.isPaid);
    if (allPaid) split.isSettled = true;

    await split.save();

    // Generate AI message
    let dramaticMessage = '';
    try {
      if (allPaid) {
        dramaticMessage = `💸 ${participant.name} paid ৳${payAmount.toFixed(2)} — still owes ৳${remaining.toFixed(2)} for "${split.title}"`;
      } else if (participant.isPaid) {
        dramaticMessage = await generateSplitMessage('settle_one', split.title, payAmount, split.participants.length, participant.name);
      } else {
        dramaticMessage = `💸 ${participant.name} paid ৳${payAmount.toFixed(2)} — still owes ৳${remaining.toFixed(2)} for "${split.title}"`;
      }
    } catch (err) {
      dramaticMessage = `💸 ${participant.name} paid ৳${payAmount.toFixed(2)} — ৳${remaining.toFixed(2)} remaining`;
    }

    res.status(200).json({
      success: true,
      message: dramaticMessage,
      data: split,
      allSettled: allPaid,
      dramaticMessage
    });
  } catch (error) {
    console.error('Error processing partial payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process partial payment', error: error.message });
  }
};

/**
 * Treat a participant — forgive their share (no wallet credit)
 */
exports.treatParticipant = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id, participantId } = req.params;

    const split = await Split.findOne({ _id: id, userId });
    if (!split) {
      return res.status(404).json({ success: false, message: 'Split not found' });
    }

    const participant = split.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    if (participant.isPaid) {
      return res.status(400).json({ success: false, message: `${participant.name} is already settled` });
    }

    // Mark as treated — no wallet credit (you're covering their share)
    participant.isPaid = true;
    participant.isTreated = true;
    participant.paidAt = new Date();

    // Check if all settled
    const allPaid = split.participants.every(p => p.isPaid);
    if (allPaid) split.isSettled = true;

    await split.save();

    // Generate dramatic AI message
    let dramaticMessage = '';
    try {
      dramaticMessage = await generateSplitMessage(
        'treat',
        split.title,
        participant.amount,
        split.participants.length,
        participant.name
      );
    } catch (err) {
      console.error('[SPLIT] AI message failed for treat, using fallback');
      dramaticMessage = `🎁 You treated ${participant.name} to their ৳${participant.amount.toFixed(2)} share of "${split.title}"! What a legend! 👑`;
    }

    res.status(200).json({
      success: true,
      message: dramaticMessage,
      data: split,
      allSettled: allPaid,
      dramaticMessage
    });
  } catch (error) {
    console.error('Error treating participant:', error);
    res.status(500).json({ success: false, message: 'Failed to treat participant', error: error.message });
  }
};
