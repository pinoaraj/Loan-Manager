import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, MessageCircle, ChevronRight, CheckCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLoans } from '../context/useLoans';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';
import { downloadPaymentReminder } from '../utils/calendar';
import { formatCurrency } from '../utils/formatters';

const getPaymentDetailPath = (loanId, paymentId) => paymentId
    ? `/loans/${loanId}?payment=${paymentId}`
    : `/loans/${loanId}`;

const TabButton = ({ active, onClick, children, count, color }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all ${active
            ? color === 'red'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
    >
        {children}
        {count !== undefined && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                {count}
            </span>
        )}
    </button>
);

const Collections = () => {
    const navigate = useNavigate();
    const { alerts, loading } = useLoans();
    const [activeTab, setActiveTab] = useState('overdue');
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) return <div className="p-8">Cargando...</div>;

    const overduePayments = alerts.filter((alert) => alert.type === 'overdue');
    const upcomingPayments = alerts.filter((alert) => alert.type === 'upcoming');
    const displayedPayments = activeTab === 'overdue' ? overduePayments : upcomingPayments;
    const filteredPayments = displayedPayments.filter((payment) =>
        payment.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTotalAmount = (payments) => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return (
        <div className="space-y-6 p-8">
            <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gestion de Cobranza</h2>
                    <p className="text-slate-600 dark:text-slate-300">Administra los pagos vencidos y proximos a vencer.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
                    <div>
                        <p className="mb-1 font-medium text-red-600 dark:text-red-400">Total Vencido</p>
                        <h3 className="text-3xl font-bold text-red-700 dark:text-red-300">
                            ${formatCurrency(getTotalAmount(overduePayments))}
                        </h3>
                        <p className="mt-2 text-sm text-red-500">{overduePayments.length} pagos pendientes</p>
                    </div>
                    <div className="rounded-xl bg-red-100 p-4 text-red-600 shadow-sm dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle size={32} />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <div>
                        <p className="mb-1 font-medium text-blue-600 dark:text-blue-400">Proximos Cobros (30 dias)</p>
                        <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            ${formatCurrency(getTotalAmount(upcomingPayments))}
                        </h3>
                        <p className="mt-2 text-sm text-blue-500">{upcomingPayments.length} pagos programados</p>
                    </div>
                    <div className="rounded-xl bg-blue-100 p-4 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                        <Calendar size={32} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900/50 md:flex-row">
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === 'overdue'}
                        onClick={() => setActiveTab('overdue')}
                        count={overduePayments.length}
                        color="red"
                    >
                        Vencidos
                    </TabButton>
                    <TabButton
                        active={activeTab === 'upcoming'}
                        onClick={() => setActiveTab('upcoming')}
                        count={upcomingPayments.length}
                        color="blue"
                    >
                        Proximos
                    </TabButton>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-xl bg-white py-2 pl-10 pr-4 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-slate-700"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {filteredPayments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-300">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No hay pagos {activeTab === 'overdue' ? 'vencidos' : 'proximos'} encontrados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredPayments.map((item, index) => {
                            const phone = item.clientPhone || '';
                            const reminderMsg = getReminderMessage(item.clientName, item.amount, item.dueDate, item.type, {
                                loanId: item.loanId,
                                paymentId: item.paymentId
                            });

                            return (
                                <div key={index} className="flex flex-col items-center gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 md:flex-row">
                                    <button
                                        onClick={() => downloadPaymentReminder(item, item.clientName, { loanId: item.loanId, paymentId: item.paymentId })}
                                        title="Descargar recordatorio de calendario"
                                        className={`rounded-full p-3 transition-colors ${activeTab === 'overdue'
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                            : 'bg-blue-50 text-blue-500 hover:bg-blue-100'
                                            }`}
                                    >
                                        <Calendar size={20} />
                                    </button>

                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">{item.clientName}</h4>
                                        <p className={`text-sm ${activeTab === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {activeTab === 'overdue'
                                                ? `Vencio hace ${item.daysOverdue} dias`
                                                : `Vence en ${item.daysUntil} dias`}
                                            <span className="mx-2 text-slate-400 dark:text-slate-500">-</span>
                                            <span className="text-slate-700 dark:text-slate-200">
                                                {format(parseISO(item.dueDate), 'd MMMM yyyy', { locale: es })}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                                            ${formatCurrency(item.amount)}
                                        </div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300">Monto a pagar</div>
                                    </div>

                                    <div className="mt-4 flex w-full gap-2 md:mt-0 md:w-auto">
                                        {phone && (
                                            <a
                                                href={generateWhatsAppLink(phone, reminderMsg)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-600 transition-colors hover:bg-green-100 md:flex-none"
                                            >
                                                <MessageCircle size={18} />
                                                <span className="md:hidden">WhatsApp</span>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => navigate(getPaymentDetailPath(item.loanId, item.paymentId))}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 md:flex-none"
                                        >
                                            <span>Ver Cobro</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Collections;
