import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PortfolioChart = ({ data }) => {
    // Ensure data exists and format colors
    const chartData = data && data.length > 0 ? data : [
        { name: 'Sin Datos', value: 100, color: '#e2e8f0' } // Placeholder gray
    ];

    const COLORS = chartData.map(d => d.color);

    return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-full flex flex-col overflow-hidden">
            <div className="mb-1 shrink-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Estado de Cartera</h3>
                <p className="text-slate-500 text-[10px]">Distribución por estado</p>
            </div>
            <div className="flex-1 min-h-0 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                fontSize: '12px',
                                padding: '8px'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', bottom: 0, width: '100%', lineHeight: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                        {chartData.reduce((acc, curr) => acc + (curr.name === 'Sin Datos' ? 0 : curr.value), 0)}
                    </span>
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Total</p>
                </div>
            </div>
        </div>
    );
};

export default PortfolioChart;
