import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
    return (
        <div className="glass-panel p-5 rounded-3xl h-full flex flex-col">
            <div className="mb-4 shrink-0">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">Tendencia de Ingresos</h3>
                <p className="text-teal-600/70 text-[10px] font-bold">FLUJO DE CAJA 6 MESES</p>
            </div>
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <CartesianGrid vertical={false} stroke="rgba(203, 213, 225, 0.3)" strokeDasharray="3 3" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Recaudado']}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#14b8a6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
