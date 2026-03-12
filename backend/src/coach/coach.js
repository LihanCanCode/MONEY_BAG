const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../transactions/transaction.model');
const Budget = require('../budgets/budget.model');
const Goal = require('../goals/goal.model');
const Debt = require('../debts/debt.model');
const RecurringTransaction = require('../recurring/recurring.model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Context Builder ───────────────────────────────────────────────────────

/**
 * Gathers the user's real financial data from MongoDB to ground the AI.
 * Runs all DB queries in parallel for speed.
 */
async function buildFinancialContext(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [recentTransactions, budgets, goals, debts, recurring] = await Promise.all([
    Transaction.find({ userId, createdAt: { $gte: sixtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean(),
    Budget.find({ userId, isActive: true }).lean(),
    Goal.find({ userId, isCompleted: false }).lean(),
    Debt.find({ userId, amount: { $gt: 0 } }).lean(),
    RecurringTransaction.find({ userId, isActive: true }).lean(),
  ]);

  // ── Compute wallet balance from all-time transactions ──
  const allTransactions = await Transaction.find({ userId }).lean();
  const balance = allTransactions.reduce((sum, t) => {
    return t.type === 'ADD' ? sum + t.amount : sum - t.amount;
  }, 0);

  // ── Summarise spending by category this month ──
  const thisMonthSpend = recentTransactions.filter(
    t => t.type === 'SPEND' && new Date(t.createdAt) >= startOfMonth
  );
  const thisMonthIncome = recentTransactions.filter(
    t => t.type === 'ADD' && new Date(t.createdAt) >= startOfMonth
  );

  const categorySpend = {};
  for (const t of thisMonthSpend) {
    const cat = t.category || 'other';
    categorySpend[cat] = (categorySpend[cat] || 0) + t.amount;
  }

  const totalSpentThisMonth = thisMonthSpend.reduce((s, t) => s + t.amount, 0);
  const totalIncomeThisMonth = thisMonthIncome.reduce((s, t) => s + t.amount, 0);

  // ── Enrich budgets with current spend % ──
  const budgetSummary = budgets.map(b => {
    const spent = categorySpend[b.category] || 0;
    const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    return {
      category: b.category,
      budgetLimit: b.amount,
      spent,
      percentUsed: percent,
      period: b.period,
      status: percent >= 100 ? 'over budget' : percent >= b.alertThreshold ? 'near limit' : 'ok',
    };
  });

  // ── Enrich goals with progress ──
  const goalSummary = goals.map(g => {
    const progress = g.targetAmount > 0
      ? Math.round((g.currentAmount / g.targetAmount) * 100)
      : 0;
    const daysLeft = Math.ceil((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24));
    return {
      name: g.name,
      category: g.category,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      progressPercent: progress,
      daysUntilDeadline: daysLeft,
      priority: g.priority,
    };
  });

  // ── Debt summary ──
  const owedToMe = debts.filter(d => d.type === 'owed_to_me');
  const iOwe = debts.filter(d => d.type === 'i_owe');
  const debtSummary = {
    totalOwedToMe: owedToMe.reduce((s, d) => s + d.amount, 0),
    totalIOwe: iOwe.reduce((s, d) => s + d.amount, 0),
    entries: debts.map(d => ({
      person: d.personName,
      type: d.type,
      amount: d.amount,
      dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : null,
    })),
  };

  // ── Recurring summary ──
  const recurringSummary = recurring.map(r => ({
    name: r.message || (r.type === 'ADD' ? 'Income' : 'Expense'),
    type: r.type,
    amount: r.amount,
    frequency: r.frequency,
    nextDueDate: r.nextDueDate ? new Date(r.nextDueDate).toISOString().split('T')[0] : null,
  }));

  // ── Last 10 transactions for conversation context ──
  const recentTxSummary = recentTransactions.slice(0, 10).map(t => ({
    type: t.type,
    category: t.category,
    amount: t.amount,
    description: t.message,
    date: new Date(t.createdAt).toISOString().split('T')[0],
  }));

  return {
    currentDate: now.toISOString().split('T')[0],
    walletBalance: Math.round(balance * 100) / 100,
    thisMonth: {
      totalIncome: totalIncomeThisMonth,
      totalSpent: totalSpentThisMonth,
      netCashFlow: totalIncomeThisMonth - totalSpentThisMonth,
      spendingByCategory: categorySpend,
    },
    budgets: budgetSummary,
    goals: goalSummary,
    debts: debtSummary,
    recurringItems: recurringSummary,
    recentTransactions: recentTxSummary,
  };
}

// ─── System Prompt ─────────────────────────────────────────────────────────

function buildSystemPrompt(context) {
  return `You are MoneyBag's personal Money Coach — a friendly, insightful, and occasionally witty financial advisor.
You have access to the user's REAL financial data shown below. Your answers must be grounded exclusively in this data.

IMPORTANT RULES:
- Be concise: 2–4 sentences unless a longer breakdown is genuinely useful.
- NEVER fabricate numbers. Only reference figures that appear in the snapshot.
- If the data doesn't cover something the user asks, say so honestly.
- Use emojis sparingly for warmth, but don't overdo it.
- Do NOT give legal, tax, or regulatory advice.
- When the user asks about a specific category or goal, reference exact numbers from the snapshot.
- Always be encouraging but honest about overspending or behind-schedule goals.
- Use Taka (৳) as the primary currency for all monetary mentions.

--- USER FINANCIAL SNAPSHOT (as of ${context.currentDate}) ---
${JSON.stringify(context, null, 2)}
--- END SNAPSHOT ---`;
}

// ─── Controller ────────────────────────────────────────────────────────────

/**
 * POST /api/coach/chat
 * Body: { message: string, history: [{ role: 'user'|'model', parts: [{ text: string }] }] }
 */
const chatWithCoach = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    // 1. Build financial context from live MongoDB data
    const context = await buildFinancialContext(userId);

    // 2. Initialise the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(context),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    // 3. Start a multi-turn chat session
    // history is an array of { role: 'user'|'model', parts: [{ text }] }
    const chat = model.startChat({ history });

    // 4. Send the new user message
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text().trim();

    res.json({ success: true, reply });
  } catch (error) {
    console.error('[MoneyCoach] Chat error:', error);
    res.status(500).json({ success: false, message: 'Money Coach is unavailable right now. Try again in a moment.' });
  }
};

module.exports = { chatWithCoach };
