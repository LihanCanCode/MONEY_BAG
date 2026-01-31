import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BudgetChart = ({ data }) => {
    // Transform data for the chart
    const chartData = data.map(item => ({
        category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        Budgeted: item.budgeted,
        Actual: item.actual,
    }));

    return (
        <div className="budget-chart" style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                        dataKey="category"
                        stroke="#fff"
                        tick={{ fill: '#fff' }}
                    />
                    <YAxis
                        stroke="#fff"
                        tick={{ fill: '#fff' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Legend
                        wrapperStyle={{ color: '#fff' }}
                    />
                    <Bar
                        dataKey="Budgeted"
                        fill="#4CAF50"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        dataKey="Actual"
                        fill="#2196F3"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BudgetChart;
