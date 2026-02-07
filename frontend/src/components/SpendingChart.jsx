import React from 'react';
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
import { FiActivity, FiPieChart } from 'react-icons/fi';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const SpendingChart = ({ wallet }) => {
    // Safe default data
    const income = wallet?.totalIncome || 0;
    const expense = wallet?.totalExpense || 0;
    const balance = wallet?.currentBalance || 0;

    const doughnutData = {
        labels: ['Expenses', 'Remaining Balance'],
        datasets: [
            {
                data: [expense, balance],
                backgroundColor: [
                    '#F43F5E', // Rose-500
                    '#6366F1', // Indigo-500
                ],
                borderColor: [
                    '#F43F5E',
                    '#6366F1',
                ],
                borderWidth: 0,
            },
        ],
    };

    // Process real transactions for monthly aggregates
    const processMonthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Get last 6 months including current
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

        // Check if we have any real data
        const hasData = last6Months.some(m => m.income > 0 || m.expense > 0);

        // If no real data, use sample data for better UI
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
                borderColor: '#10B981', // Emerald-500
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
                borderColor: '#F43F5E', // Rose-500
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
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
                    padding: 24 // Add more space between legend items
                }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: '#374151', // Border color
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0B1121] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group my-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiActivity className="text-emerald-400" />
                    Income vs Expense
                </h3>
                <div className="h-72 w-full">
                    <Line data={lineData} options={{ ...options, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="bg-[#0B1121] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group my-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiPieChart className="text-indigo-400" />
                    Financial Overview
                </h3>
                <div className="h-64 flex items-center justify-center">
                    <Doughnut
                        data={doughnutData}
                        options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#94a3b8',
                                        usePointStyle: true,
                                        padding: 20,
                                        font: { family: 'inherit', size: 12, weight: '600' }
                                    }
                                }
                            },
                            cutout: '75%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SpendingChart;
