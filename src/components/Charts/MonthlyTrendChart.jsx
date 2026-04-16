import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonthlyTrendChart({ expenses }) {
    if (!expenses || expenses.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400">No data to display</div>;
    }

    // Process data to get daily totals for the last 7 instances or current month
    // Let's show the last 7 distinct days with activity for better visualization
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dailyData = sortedExpenses.reduce((acc, curr) => {
        const date = curr.date; // Assuming YYYY-MM-DD
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.amount += Number(curr.amount);
        } else {
            acc.push({ date, amount: Number(curr.amount) });
        }
        return acc;
    }, []);

    // Take last 7 days for cleanliness, or all if less
    const data = dailyData.slice(-7);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Trend (Last 7 Days)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const d = new Date(value);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
