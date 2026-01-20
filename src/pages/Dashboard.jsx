import React from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, AlertCircle, CreditCard, TrendingUp, MessageCircle } from 'lucide-react';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { dashboardStats, clients, alerts, getCollectionProjections } = useLoans();
    const { totalActiveLoans, totalLent, statusData } = dashboardStats();
    const projections = getCollectionProjections();

    return (
        <div className="p-8 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Panel Principal</h2>
                    <p className="text-slate-500">Bienvenido de vuelta, aquí está el resumen de hoy.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Préstamos Activos"
                    value={totalActiveLoans}
                    icon={DollarSign}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Prestado"
                    value={`$${totalLent.toLocaleString()}`}
                    icon={CreditCard}
                    color="bg-teal-500"
                />
                <StatCard
                    title="Monto Vencido"
                    value={`$${alerts.filter(a => a.type === 'overdue').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`}
                    icon={AlertCircle}
                    color="bg-red-500"
                />
                <StatCard
                    title="Clientes Totales"
                    value={clients.length}
                    icon={Users}
                    color="bg-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Projections Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={20} />
                        Proyección de Cobros
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projections}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Por Cobrar']}
                                />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Distribución de Préstamos</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertCircle className="text-amber-500" size={20} />
                        Alertas de Pago
                    </h3>
                    <button
                        onClick={() => navigate('/collections')}
                        className="text-sm text-blue-500 font-medium hover:text-blue-600 hover:underline"
                    >
                        Ver Todo
                    </button>
                </div>
                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <p className="text-slate-500 text-sm">No hay alertas pendientes.</p>
                    ) : (
                        alerts.slice(0, 5).map((alert, index) => {
                            // Find client to get phone number (assuming we have access to full client object or can derive it)
                            const client = clients.find(c => c.name === alert.clientName); // Simple matching for now
                            const phone = client?.phone || '';
                            const reminderMsg = getReminderMessage(alert.clientName, alert.amount, alert.dueDate, alert.type);

                            return (
                                <div
                                    key={index}
                                    className={`p-4 border rounded-xl flex items-center gap-4 transition-all hover:shadow-md ${alert.type === 'overdue' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                                        }`}
                                >
                                    <div
                                        onClick={() => navigate(`/loans/${alert.loanId}`)}
                                        className={`p-2 rounded-full cursor-pointer ${alert.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                                    >
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/loans/${alert.loanId}`)}>
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-semibold ${alert.type === 'overdue' ? 'text-red-900 dark:text-red-300' : 'text-amber-900 dark:text-amber-300'}`}>
                                                {alert.clientName}
                                            </h4>
                                            <span className={`text-sm font-bold ${alert.type === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                ${alert.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${alert.type === 'overdue' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'} mt-1`}>
                                            {alert.type === 'overdue'
                                                ? `Venció hace ${alert.daysOverdue} días (${alert.dueDate})`
                                                : `Vence en ${alert.daysUntil} días (${alert.dueDate})`
                                            }
                                        </p>
                                    </div>
                                    {phone && (
                                        <a
                                            href={generateWhatsAppLink(phone, reminderMsg)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-white dark:bg-slate-800 text-green-600 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm"
                                            title="Enviar Recordatorio por WhatsApp"
                                        >
                                            <MessageCircle size={18} />
                                        </a>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
