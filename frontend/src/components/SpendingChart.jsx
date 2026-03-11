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
import { FaChartLine, FaChartPie } from 'react-icons/fa';

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
    const income = wallet?.totalIncome || 0;
    const expense = wallet?.totalExpense || 0;
    const balance = wallet?.currentBalance || 0;

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
        <div className="spending-charts">
            <div className="chart-card">
                <h3 className="chart-title">
                    <FaChartLine className="chart-icon green" />
                    Income vs Expense
                </h3>
                <div className="chart-wrapper line-chart">
                    <Line data={lineData} options={{ ...options, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="chart-card">
                <h3 className="chart-title">
                    <FaChartPie className="chart-icon blue" />
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

export default SpendingChart;
