import React from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Calendar } from 'lucide-react';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';
import { generateGoogleCalendarLink, getPaymentEventDetails } from '../utils/calendar';
import DashboardKPI from '../components/dashboard/DashboardKPI';
import RevenueChart from '../components/dashboard/RevenueChart';
import PortfolioChart from '../components/dashboard/PortfolioChart';
import RecentActivity from '../components/dashboard/RecentActivity';

import { Skeleton } from '../components/ui/Skeleton';

const Dashboard = () => {
    const navigate = useNavigate();
    const { dashboardStats, alerts, getCollectionProjections, recentActivity, clients, loading } = useLoans();
    const { statusData } = dashboardStats;
    const projections = getCollectionProjections();

    if (loading) {
        return (
            <div className="p-3 space-y-3 max-w-[1600px] mx-auto">
                <header className="flex justify-between items-center mb-1">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 h-auto xl:h-[250px]">
                    <Skeleton className="xl:col-span-2 h-full rounded-2xl" />
                    <Skeleton className="xl:col-span-1 h-full rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 h-auto xl:h-[250px]">
                    <Skeleton className="xl:col-span-1 h-full rounded-2xl" />
                    <Skeleton className="xl:col-span-2 h-full rounded-2xl" />
                </div>
            </div>
        );
    }

    // Augment dashboardStats with calculated healthScore if missing
    // Assuming healthScore = (Active / (Active + Overdue)) * 100 or something similar
    // The previous code didn't have healthScore, so let's default it or calculate it.
    const activeCount = statusData.find(d => d.name === 'Activos')?.value || 0;
    const overdueCount = statusData.find(d => d.name === 'Vencidos')?.value || 0;
    const totalCount = activeCount + overdueCount;
    const healthScore = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;

    const stats = {
        ...dashboardStats,
        healthScore
    };

    return (
        <div className="p-3 space-y-3 max-w-[1600px] mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-1">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Panel Principal</h2>
                    <p className="text-slate-500 text-xs">Resumen financiero y operativo.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/loans/new')}
                        className="glass-button px-5 py-2.5 rounded-pill font-bold shadow-lg text-xs tracking-wide flex items-center gap-2"
                    >
                        + NUEVO PRÉSTAMO
                    </button>
                </div>
            </header>

            {/* KPI Grid */}
            <DashboardKPI stats={stats} />

            {/* Main Visualizations Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 h-auto xl:h-[250px]">
                {/* Revenue Chart (2/3 width on large screens) */}
                <div className="xl:col-span-2 h-full">
                    <RevenueChart data={projections} />
                </div>
                {/* Portfolio Donut (1/3 width) */}
                <div className="xl:col-span-1 h-full">
                    <PortfolioChart data={statusData} />
                </div>
            </div>

            {/* Bottom Row: Recent Activity & Alerts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 h-auto xl:h-[250px]">
                {/* Recent Activity (1/3 width) */}
                <div className="xl:col-span-1 h-full overflow-hidden">
                    <RecentActivity transactions={recentActivity} />
                </div>

                {/* Alerts (2/3 width) */}
                <div className="xl:col-span-2 glass-panel rounded-3xl p-5 h-full overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <AlertCircle className="text-[var(--color-accent-500)]" size={18} />
                            Alertas de Pago
                        </h3>
                        <button
                            onClick={() => navigate('/collections')}
                            className="text-xs text-teal-600 font-bold hover:text-teal-700 hover:underline"
                        >
                            VER TODO
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1">
                        {alerts.length === 0 ? (
                            <p className="text-slate-500 text-sm col-span-2">No hay alertas pendientes.</p>
                        ) : (
                            alerts.slice(0, 4).map((alert, index) => {
                                // Find client to get phone number
                                const client = clients.find(c => c.name === alert.clientName);
                                const phone = client?.phone || '';
                                const reminderMsg = getReminderMessage(alert.clientName, alert.amount, alert.dueDate, alert.type);

                                // Generate Calendar Link
                                // Note: Alert object structure in this app is simplified. We'll use generic values if detailed payment index isn't available.
                                const paymentDetails = getPaymentEventDetails(
                                    alert.clientName,
                                    alert.amount,
                                    alert.paymentNumber || 'Pendiente',
                                    alert.totalPayments || 'Total'
                                );
                                const calendarLink = generateGoogleCalendarLink({
                                    ...paymentDetails,
                                    date: alert.dueDate
                                });

                                return (
                                    <div
                                        key={index}
                                        className={`p-3 border rounded-xl flex items-center gap-3 transition-all hover:bg-opacity-50 ${alert.type === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                                            }`}
                                    >
                                        <div
                                            onClick={() => navigate(`/loans/${alert.loanId}`)}
                                            className={`p-1.5 rounded-full cursor-pointer shrink-0 ${alert.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                                        >
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/loans/${alert.loanId}`)}>
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate pr-2">
                                                    {alert.clientName}
                                                </h4>
                                                <span className={`text-xs font-bold shrink-0 ${alert.type === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    ${alert.amount.toFixed(0)}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] mt-0.5 ${alert.type === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>
                                                {alert.type === 'overdue'
                                                    ? `Venció hace ${alert.daysOverdue} días`
                                                    : `Vence en ${alert.daysUntil} días`
                                                }
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <a
                                                href={calendarLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 bg-white text-indigo-500 rounded-lg border border-slate-200 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                                                title="Agendar Recordatorio"
                                            >
                                                <Calendar size={16} />
                                            </a>
                                            {phone && (
                                                <a
                                                    href={generateWhatsAppLink(phone, reminderMsg)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-white text-emerald-500 rounded-lg border border-slate-200 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-sm"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
