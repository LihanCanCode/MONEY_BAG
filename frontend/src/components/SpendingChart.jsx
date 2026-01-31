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

    // Mock monthly data
    const lineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Income',
                data: [1200, 1900, 3000, 500, 2000, 300],
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
                data: [800, 1200, 2600, 1000, 900, 600],
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
                    boxWidth: 8
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
        <div className="flex flex-col gap-6">
            <div className="bg-[#141B2D] !p-8 rounded-[10px] border border-[#2D3748] shadow-lg w-full">
                <h3 className="text-lg font-bold !text-white mb-6">Income vs Expense</h3>
                <div className="h-72 w-full">
                    <Line data={lineData} options={{ ...options, maintainAspectRatio: false }} />
                </div>
            </div>

            <div className="bg-[#141B2D] !p-8 rounded-[10px] border border-[#2D3748] shadow-lg w-full">
                <h3 className="text-lg font-bold !text-white mb-6">Financial Overview</h3>
                <div className="h-64 flex items-center justify-center">
                    <Doughnut
                        data={doughnutData}
                        options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { labels: { color: '#9CA3AF', usePointStyle: true, font: { family: 'sans-serif', size: 12 } } } }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SpendingChart;
