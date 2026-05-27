import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PortfolioChart = ({ data }) => {
    // Custom Palette for Fluid Glass
    const COLORS = ['#2dd4bf', '#8b5cf6', '#fb7185', '#f472b6'];

    // Ensure data exists and map to new colors
    const chartData = data && data.length > 0 ? data.map((d, i) => ({
        ...d,
        color: COLORS[i % COLORS.length]
    })) : [
        { name: 'Sin Datos', value: 100, color: '#ecf0f1' }
    ];

    return (
        <div className="glass-panel flex h-full min-h-[220px] min-w-0 flex-col overflow-hidden rounded-3xl p-5">
            <div className="mb-2 shrink-0">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">Estado de Cartera</h3>
                <p className="text-teal-600/70 text-[10px] font-bold">DISTRIBUCIÓN</p>
            </div>
            <div className="relative h-[180px] w-full min-w-0 flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.5)',
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', fontWeight: 600, bottom: 0 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-2xl font-display font-bold text-slate-700 dark:text-white">
                        {chartData.reduce((acc, curr) => acc + (curr.name === 'Sin Datos' ? 0 : curr.value), 0)}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
                </div>
            </div>
        </div>
    );
};

export default PortfolioChart;
