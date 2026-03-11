const Transaction = require('../transactions/transaction.model');
const RecurringTransaction = require('../recurring/recurring.model');
const Debt = require('../debts/debt.model');
const Goal = require('../goals/goal.model');
const Budget = require('../budgets/budget.model');

/**
 * GET /api/calendar/events
 * Returns all financial events for a date range, aggregated from every module.
 *
 * Query params:
 *   startDate  – ISO date string (default: start of current month)
 *   endDate    – ISO date string (default: end of current month)
 */
const getCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.uid;

        const now = new Date();
        const startDate = req.query.startDate
            ? new Date(req.query.startDate)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = req.query.endDate
            ? new Date(req.query.endDate)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const events = [];

        // ── 1. Past Transactions (actual income / expenses) ──
        const transactions = await Transaction.find({
            userId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: 1 }).lean();

        for (const t of transactions) {
            events.push({
                id: t._id,
                date: t.createdAt,
                type: 'transaction',
                subType: t.type,           // ADD | SPEND
                category: t.category,
                amount: t.amount,
                title: t.message || (t.type === 'ADD' ? 'Income' : 'Expense'),
                color: t.type === 'ADD' ? '#10B981' : '#EF4444'
            });
        }

        // ── 2. Recurring Transaction Due Dates ──
        const recurring = await RecurringTransaction.find({
            userId,
            isActive: true,
            nextDueDate: { $gte: startDate, $lte: endDate }
        }).lean();

        for (const r of recurring) {
            events.push({
                id: r._id,
                date: r.nextDueDate,
                type: 'recurring',
                subType: r.type,
                category: r.category,
                amount: r.amount,
                title: r.message || `Recurring ${r.type === 'ADD' ? 'Income' : 'Expense'}`,
                frequency: r.frequency,
                color: '#8B5CF6'    // purple
            });
        }

        // Also project future recurring occurrences within the window
        const allRecurring = await RecurringTransaction.find({
            userId,
            isActive: true
        }).lean();

        for (const r of allRecurring) {
            const projected = projectRecurringDates(r, startDate, endDate);
            for (const date of projected) {
                events.push({
                    id: `${r._id}_proj_${date.toISOString()}`,
                    date,
                    type: 'recurring_projected',
                    subType: r.type,
                    category: r.category,
                    amount: r.amount,
                    title: r.message || `Upcoming ${r.type === 'ADD' ? 'Income' : 'Expense'}`,
                    frequency: r.frequency,
                    color: '#A78BFA'   // lighter purple
                });
            }
        }

        // ── 3. Debt Due Dates ──
        const debts = await Debt.find({
            userId,
            amount: { $gt: 0 },
            dueDate: { $gte: startDate, $lte: endDate }
        }).lean();

        for (const d of debts) {
            const isOverdue = d.dueDate < now && d.amount > 0;
            events.push({
                id: d._id,
                date: d.dueDate,
                type: 'debt',
                subType: d.type,           // owed_to_me | i_owe
                amount: d.amount,
                title: `${d.type === 'i_owe' ? 'Pay' : 'Collect from'} ${d.personName}`,
                personName: d.personName,
                isOverdue,
                color: isOverdue ? '#F59E0B' : '#F97316'   // amber if overdue, orange otherwise
            });
        }

        // ── 4. Goal Deadlines ──
        const goals = await Goal.find({
            userId,
            isCompleted: false,
            deadline: { $gte: startDate, $lte: endDate }
        }).lean();

        for (const g of goals) {
            const progress = g.targetAmount > 0
                ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                : 0;
            events.push({
                id: g._id,
                date: g.deadline,
                type: 'goal',
                amount: g.targetAmount,
                currentAmount: g.currentAmount,
                title: `Goal: ${g.name}`,
                progress,
                category: g.category,
                priority: g.priority,
                color: '#3B82F6'    // blue
            });
        }

        // ── 5. Budget Period Resets ──
        const budgets = await Budget.find({ userId, isActive: true }).lean();

        for (const b of budgets) {
            const resetDates = getBudgetResetDates(b, startDate, endDate);
            for (const date of resetDates) {
                events.push({
                    id: `${b._id}_reset_${date.toISOString()}`,
                    date,
                    type: 'budget_reset',
                    category: b.category,
                    amount: b.amount,
                    title: `Budget resets: ${b.category}`,
                    period: b.period,
                    color: '#06B6D4'   // cyan
                });
            }
        }

        // Sort all events by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Calendar events error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch calendar events' });
    }
};

// ─── Helpers ───

/**
 * Project future recurring dates within a window, skipping the nextDueDate
 * (which is already included above).
 */
function projectRecurringDates(recurring, windowStart, windowEnd) {
    const dates = [];
    if (!recurring.nextDueDate) return dates;

    let current = new Date(recurring.nextDueDate);
    // Skip the first one (already added from the direct query)
    current = advanceDate(current, recurring.frequency);

    const limit = recurring.endDate ? new Date(recurring.endDate) : windowEnd;
    const cap = limit < windowEnd ? limit : windowEnd;

    let safety = 0;
    while (current <= cap && safety < 400) {
        if (current >= windowStart) {
            dates.push(new Date(current));
        }
        current = advanceDate(current, recurring.frequency);
        safety++;
    }
    return dates;
}

function advanceDate(date, frequency) {
    const d = new Date(date);
    switch (frequency) {
        case 'daily':   d.setDate(d.getDate() + 1); break;
        case 'weekly':  d.setDate(d.getDate() + 7); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
    }
    return d;
}

/**
 * Compute budget reset dates that fall inside the given window.
 */
function getBudgetResetDates(budget, windowStart, windowEnd) {
    const dates = [];
    const start = new Date(budget.startDate);
    let current = new Date(start);

    let safety = 0;
    while (current <= windowEnd && safety < 400) {
        if (budget.period === 'monthly') {
            current.setMonth(current.getMonth() + 1);
        } else {
            current.setFullYear(current.getFullYear() + 1);
        }

        if (current >= windowStart && current <= windowEnd) {
            dates.push(new Date(current));
        }
        safety++;
    }
    return dates;
}

module.exports = { getCalendarEvents };
