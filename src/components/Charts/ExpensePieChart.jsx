import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ExpensePieChart({ expenses }) {
    if (!expenses || expenses.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400">No data to display</div>;
    }

    const data = expenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
            existing.value += Number(curr.amount);
        } else {
            acc.push({ name: curr.category, value: Number(curr.amount) });
        }
        return acc;
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Spending by Category</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => `₹${value.toLocaleString()}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
