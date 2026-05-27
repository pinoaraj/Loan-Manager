import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageCircle, Calendar, Download } from 'lucide-react';
import { useLoans } from '../context/useLoans';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';
import { downloadPaymentReminder } from '../utils/calendar';
import DashboardKPI from '../components/dashboard/DashboardKPI';
import RecentActivity from '../components/dashboard/RecentActivity';
import { Skeleton } from '../components/ui/Skeleton';

const getPaymentDetailPath = (loanId, paymentId) => paymentId
    ? `/loans/${loanId}?payment=${paymentId}`
    : `/loans/${loanId}`;

const RevenueChart = lazy(() => import('../components/dashboard/RevenueChart'));
const PortfolioChart = lazy(() => import('../components/dashboard/PortfolioChart'));

const ChartSkeleton = () => <Skeleton className="h-full rounded-2xl" />;

const Dashboard = () => {
    const navigate = useNavigate();
    const { dashboardStats, alerts, getCollectionProjections, recentActivity, loading, downloadReport } = useLoans();
    const { statusData } = dashboardStats;
    const projections = getCollectionProjections();

    if (loading) {
        return (
            <div className="mx-auto max-w-[1600px] space-y-3 p-3">
                <header className="mb-1 flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </header>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
                </div>
                <div className="grid h-auto grid-cols-1 gap-3 xl:h-[250px] xl:grid-cols-3">
                    <Skeleton className="h-full rounded-2xl xl:col-span-2" />
                    <Skeleton className="h-full rounded-2xl xl:col-span-1" />
                </div>
                <div className="grid h-auto grid-cols-1 gap-3 xl:h-[250px] xl:grid-cols-3">
                    <Skeleton className="h-full rounded-2xl xl:col-span-1" />
                    <Skeleton className="h-full rounded-2xl xl:col-span-2" />
                </div>
            </div>
        );
    }

    const activeCount = statusData?.find((item) => item.name === 'Activos')?.value || 0;
    const overdueCount = statusData?.find((item) => item.name === 'Vencidos')?.value || 0;
    const totalCount = activeCount + overdueCount;
    const healthScore = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;
    const stats = { ...dashboardStats, healthScore };

    return (
        <div className="mx-auto max-w-[1600px] space-y-3 p-3">
            <header className="mb-1 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Panel Principal</h2>
                    <p className="text-xs text-slate-500">Resumen financiero y operativo.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => downloadReport('loans')}
                        className="glass-button flex items-center gap-2 rounded-pill bg-slate-100 px-4 py-2 text-[10px] font-bold tracking-wide text-slate-600 shadow-md dark:bg-slate-700 dark:text-slate-300"
                    >
                        <Download size={14} /> EXCEL PRESTAMOS
                    </button>
                    <button
                        onClick={() => navigate('/loans/new')}
                        className="glass-button flex items-center gap-2 rounded-pill px-5 py-2.5 text-xs font-bold tracking-wide shadow-lg"
                    >
                        + NUEVO PRESTAMO
                    </button>
                </div>
            </header>

            <DashboardKPI stats={stats} />

            <div className="grid h-auto grid-cols-1 gap-3 xl:h-[250px] xl:grid-cols-3">
                <div className="min-h-[220px] min-w-0 xl:col-span-2">
                    <Suspense fallback={<ChartSkeleton />}>
                        <RevenueChart data={projections} />
                    </Suspense>
                </div>
                <div className="min-h-[220px] min-w-0 xl:col-span-1">
                    <Suspense fallback={<ChartSkeleton />}>
                        <PortfolioChart data={statusData} />
                    </Suspense>
                </div>
            </div>

            <div className="grid h-auto grid-cols-1 gap-3 xl:h-[250px] xl:grid-cols-3">
                <div className="h-full overflow-hidden xl:col-span-1">
                    <RecentActivity transactions={recentActivity} />
                </div>

                <div className="glass-panel flex h-full flex-col overflow-hidden rounded-3xl p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between shrink-0">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-white">
                            <AlertCircle className="text-[var(--color-accent-500)]" size={18} />
                            Alertas de Pago
                        </h3>
                        <button
                            onClick={() => navigate('/collections')}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                        >
                            VER TODO
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                        {alerts.length === 0 ? (
                            <p className="col-span-2 text-sm text-slate-500">No hay alertas pendientes.</p>
                        ) : (
                            alerts.slice(0, 4).map((alert, index) => {
                                const phone = alert.clientPhone || '';
                                const reminderMsg = getReminderMessage(alert.clientName, alert.amount, alert.dueDate, alert.type, {
                                    loanId: alert.loanId
                                });

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:bg-opacity-50 ${alert.type === 'overdue' ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}
                                    >
                                        <div
                                            onClick={() => navigate(getPaymentDetailPath(alert.loanId, alert.paymentId))}
                                            className={`shrink-0 cursor-pointer rounded-full p-1.5 ${alert.type === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                                        >
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(getPaymentDetailPath(alert.loanId, alert.paymentId))}>
                                            <div className="flex items-center justify-between">
                                                <h4 className="truncate pr-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {alert.clientName}
                                                </h4>
                                                <span className={`shrink-0 text-xs font-bold ${alert.type === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                                                    ${alert.amount.toFixed(0)}
                                                </span>
                                            </div>
                                            <p className={`mt-0.5 text-[10px] ${alert.type === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>
                                                {alert.type === 'overdue'
                                                    ? `Vencio hace ${alert.daysOverdue} dias`
                                                    : `Vence en ${alert.daysUntil} dias`}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                onClick={() => downloadPaymentReminder(alert, alert.clientName, {
                                                    loanId: alert.loanId
                                                })}
                                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-indigo-500 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                                title="Descargar recordatorio de calendario"
                                            >
                                                <Calendar size={16} />
                                            </button>
                                            {phone && (
                                                <a
                                                    href={generateWhatsAppLink(phone, reminderMsg)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-emerald-500 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-600"
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
