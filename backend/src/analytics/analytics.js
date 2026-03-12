const Transaction = require('../transactions/transaction.model');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const path = require('path');

// Get transaction analytics for a user
exports.getTransactionAnalytics = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { startDate, endDate } = req.query;

        // Build query
        const query = { userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const transactions = await Transaction.find(query).sort({ createdAt: -1 });

        // Calculate analytics
        const analytics = {
            totalTransactions: transactions.length,
            totalIncome: 0,
            totalExpenses: 0,
            netBalance: 0,
            categoryBreakdown: {},
            monthlyTrend: {},
            averageSatisfaction: 0,
            topCategories: []
        };

        let satisfactionCount = 0;
        let satisfactionSum = 0;

        transactions.forEach(txn => {
            if (txn.type === 'ADD') {
                analytics.totalIncome += txn.amount;
            } else {
                analytics.totalExpenses += txn.amount;

                // Category breakdown (only for expenses)
                if (txn.category) {
                    analytics.categoryBreakdown[txn.category] =
                        (analytics.categoryBreakdown[txn.category] || 0) + txn.amount;
                }
            }

            // Monthly trend
            const monthKey = new Date(txn.createdAt).toISOString().slice(0, 7); // YYYY-MM
            if (!analytics.monthlyTrend[monthKey]) {
                analytics.monthlyTrend[monthKey] = { income: 0, expenses: 0 };
            }
            if (txn.type === 'ADD') {
                analytics.monthlyTrend[monthKey].income += txn.amount;
            } else {
                analytics.monthlyTrend[monthKey].expenses += txn.amount;
            }

            // Satisfaction score
            if (txn.satisfactionScore) {
                satisfactionSum += txn.satisfactionScore;
                satisfactionCount++;
            }
        });

        analytics.netBalance = analytics.totalIncome - analytics.totalExpenses;
        analytics.averageSatisfaction = satisfactionCount > 0
            ? (satisfactionSum / satisfactionCount).toFixed(2)
            : 0;

        // Top categories
        analytics.topCategories = Object.entries(analytics.categoryBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, amount]) => ({ category, amount }));

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get analytics',
            error: error.message
        });
    }
};

// Export transactions as CSV
exports.exportTransactionsCSV = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { startDate, endDate } = req.query;

        const query = { userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const transactions = await Transaction.find(query).sort({ createdAt: -1 });

        const fields = ['type', 'category', 'amount', 'message', 'satisfactionScore', 'createdAt'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(transactions);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export CSV',
            error: error.message
        });
    }
};

// Export transactions as PDF
exports.exportTransactionsPDF = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { startDate, endDate } = req.query;

        const query = { userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const transactions = await Transaction.find(query).sort({ createdAt: -1 });

        // Calculate summary
        let totalIncome = 0;
        let totalExpenses = 0;
        transactions.forEach(txn => {
            if (txn.type === 'ADD') totalIncome += txn.amount;
            else totalExpenses += txn.amount;
        });

        // Create PDF
        // Use bundled Nirmala UI font for Bengali character (৳) support (ensures portability)
        const doc = new PDFDocument({ margin: 50 });
        const fontPath = path.join(__dirname, '../../assets/fonts/Nirmala.ttf');
        doc.font(fontPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24).fillColor('#2563eb').text('Money Bag', { align: 'center' });
        doc.fontSize(18).fillColor('#000').text('Transaction Report', { align: 'center' });
        doc.moveDown();

        // Date range
        const dateRangeText = startDate && endDate
            ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'Period: All Time';
        doc.fontSize(12).fillColor('#666').text(dateRangeText, { align: 'center' });
        doc.moveDown(2);

        // Summary Box
        doc.fontSize(14).fillColor('#000').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12)
            .text(`Total Income: ৳${totalIncome.toFixed(2)}`, { continued: false })
            .fillColor('#ef4444')
            .text(`Total Expenses: ৳${totalExpenses.toFixed(2)}`, { continued: false })
            .fillColor(totalIncome - totalExpenses >= 0 ? '#22c55e' : '#ef4444')
            .text(`Net Balance: ৳${(totalIncome - totalExpenses).toFixed(2)}`, { continued: false });

        doc.moveDown(2);

        // Transactions Table
        doc.fontSize(14).fillColor('#000').text('Transactions', { underline: true });
        doc.moveDown(0.5);

        transactions.forEach((txn, index) => {
            if (index > 0 && index % 20 === 0) {
                doc.addPage();
            }

            const date = new Date(txn.createdAt).toLocaleDateString();
            const type = txn.type === 'ADD' ? '+ Income' : '- Expense';
            const category = txn.category || 'N/A';
            const amount = `৳${txn.amount.toFixed(2)}`;

            doc.fontSize(10)
                .fillColor(txn.type === 'ADD' ? '#22c55e' : '#ef4444')
                .text(`${date} | ${type}`, 50, doc.y, { continued: true })
                .fillColor('#000')
                .text(` | ${category} | ${amount}`, { align: 'left' });

            if (txn.message) {
                doc.fontSize(9).fillColor('#666').text(`  ${txn.message}`, { indent: 20 });
            }

            doc.moveDown(0.5);
        });

        // Footer
        doc.fontSize(8).fillColor('#999').text(
            `Generated on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );

        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export PDF',
            error: error.message
        });
    }
};

// Get heatmap data (spending by day of week and time)
exports.getHeatmapData = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { startDate, endDate } = req.query;

        const query = { userId, type: 'SPEND' };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const transactions = await Transaction.find(query);

        // Initialize heatmap structure
        const heatmap = {
            daily: {}, // Day-wise spending
            hourly: {}, // Hour-wise spending
            dayOfWeek: Array(7).fill(0), // Sunday = 0, Saturday = 6
            calendar: {} // Date-wise spending (for calendar view)
        };

        transactions.forEach(txn => {
            const date = new Date(txn.createdAt);
            const dayOfWeek = date.getDay();
            const hour = date.getHours();
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

            // Day of week aggregation
            heatmap.dayOfWeek[dayOfWeek] += txn.amount;

            // Hourly aggregation
            heatmap.hourly[hour] = (heatmap.hourly[hour] || 0) + txn.amount;

            // Calendar aggregation
            if (!heatmap.calendar[dateKey]) {
                heatmap.calendar[dateKey] = {
                    date: dateKey,
                    amount: 0,
                    count: 0
                };
            }
            heatmap.calendar[dateKey].amount += txn.amount;
            heatmap.calendar[dateKey].count += 1;
        });

        res.status(200).json({
            success: true,
            data: heatmap
        });
    } catch (error) {
        console.error('Error getting heatmap data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get heatmap data',
            error: error.message
        });
    }
};
