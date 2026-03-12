/**
 * @fileoverview Spending Chart Component
 *
 * Dual-panel financial visualization dashboard displaying:
 *  - Line chart: Income vs Expense trend over the last 6 months
 *  - Doughnut chart: Expense-to-remaining-balance ratio
 *
 * Uses Chart.js via react-chartjs-2 for rendering. Falls back to
 * sample data when no real transactions exist for a better initial UX.
 *
 * @module components/SpendingChart
 */

// ── Core React ─────────────────────────────────────────────────────────────────
import React from 'react';

// ── Chart.js Modules & react-chartjs-2 Wrappers ────────────────────────────────
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// ── Icon Libraries ─────────────────────────────────────────────────────────────
import { FiActivity, FiPieChart } from 'react-icons/fi';

/**
 * Register required Chart.js components globally.
 * Must be called once before any Chart.js renderings.
 */
ChartJS.register(
    CategoryScale,   // X-axis category labels
    LinearScale,     // Y-axis numeric scale
    PointElement,    // Data points on line chart
    LineElement,     // Lines connecting data points
    Title,           // Chart title plugin
    Tooltip,         // Hover tooltips
    Legend,          // Legend labels
    ArcElement,      // Doughnut/Pie arcs
    Filler           // Area fill under line
);

/**
 * SpendingChart Component
 *
 * Renders two side-by-side chart panels:
 *  - "Income vs Expense" line chart with filled areas
 *  - "Financial Overview" doughnut showing expense/balance split
 *
 * @param {Object} props
 * @param {Object} props.wallet - Wallet data including totalIncome, totalExpense,
 *                                currentBalance, and transactions array
 * @returns {JSX.Element}
 */
const SpendingChart = ({ wallet }) => {
    // ── Safely extract wallet totals (default to 0 if missing) ──────
    const income = wallet?.totalIncome || 0;
    const expense = wallet?.totalExpense || 0;
    const balance = wallet?.currentBalance || 0;

    /** Doughnut chart data — compares expenses vs remaining balance */
    const doughnutData = {
        labels: ['Expenses', 'Remaining Balance'],
        datasets: [
            {
                data: [expense, balance],
                backgroundColor: ['#EF4444', '#10B981'],
                borderColor: ['#EF4444', '#10B981'],
                borderWidth: 0,
            },
        ],
    };

    /**
     * Process wallet transactions into monthly income/expense aggregates
     *
     * Buckets transactions from the last 6 months (inclusive) into
     * per-month totals. If no real data exists, returns sample data
     * so the chart UI looks populated on first load.
     *
     * @returns {{ labels: string[], income: number[], expense: number[] }}
     */
    const processMonthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            last6Months.push({
                label: months[m],
                year: y,
                month: m,
                income: 0,
                expense: 0,
                key: `${y}-${m}`
            });
        }

        if (wallet?.transactions) {
            wallet.transactions.forEach(tx => {
                const txDate = new Date(tx.createdAt || tx.date);
                if (isNaN(txDate.getTime())) return;

                const m = txDate.getMonth();
                const y = txDate.getFullYear();
                const key = `${y}-${m}`;

                const entry = last6Months.find(e => e.key === key);
                if (entry) {
                    if (tx.type === 'income' || tx.type === 'ADD') {
                        entry.income += tx.amount;
                    } else {
                        entry.expense += tx.amount;
                    }
                }
            });
        }

        const hasData = last6Months.some(m => m.income > 0 || m.expense > 0);

        if (!hasData) {
            return {
                labels: last6Months.map(m => m.label),
                income: [1200, 1900, 3000, 500, 2000, 300],
                expense: [800, 1200, 2600, 1000, 900, 600]
            };
        }

        return {
            labels: last6Months.map(m => m.label),
            income: last6Months.map(m => m.income),
            expense: last6Months.map(m => m.expense)
        };
    };

    const dynamicData = processMonthlyData();

    const lineData = {
        labels: dynamicData.labels,
        datasets: [
            {
                label: 'Income',
                data: dynamicData.income,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Expenses',
                data: dynamicData.expense,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9CA3AF',
                    font: {
                        family: "'Plus Jakarta Sans', sans-serif",
                        size: 12
                    },
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 24
                }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255,255,255,0.05)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        family: "'Plus Jakarta Sans', sans-serif",
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        family: "'Plus Jakarta Sans', sans-serif",
                    }
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            style={{ paddingTop: '32px', paddingBottom: '32px', paddingLeft: '32px', paddingRight: '32px' }}
        >
            <div className="bg-[#0B1121] p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2" style={{ color: '#ffffff' }}>
                    <FiActivity className="text-emerald-400" />
                    Income vs Expense
                </h3>
                <div className="chart-wrapper line-chart">
                    <Line data={lineData} options={{ ...options, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="chart-card">
                <h3 className="chart-title">
                    <FiPieChart className="chart-icon blue" />
                    Financial Overview
                </h3>
                <div className="chart-wrapper doughnut-chart">
                    <Doughnut
                        data={doughnutData}
                        options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#9CA3AF',
                                        usePointStyle: true,
                                        padding: 20,
                                        font: { size: 12, weight: '600' }
                                    }
                                }
                            },
                            cutout: '75%'
                        }}
                    />
                </div>
            </div>

            <style>{`
                .spending-charts {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    padding: 0;
                }

                .chart-card {
                    background: #1E293B;
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .chart-title {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    color: white;
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin: 0 0 1.5rem;
                }

                .chart-icon {
                    font-size: 1.125rem;
                }

                .chart-icon.green { color: #10B981; }
                .chart-icon.blue { color: #3B82F6; }

                .chart-wrapper.line-chart {
                    height: 280px;
                    width: 100%;
                }

                .chart-wrapper.doughnut-chart {
                    height: 260px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 900px) {
                    .spending-charts {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

/* Export the SpendingChart component as the default module export */
export default SpendingChart;
