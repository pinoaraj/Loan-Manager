import React, { useState } from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, MessageCircle, ChevronRight, CheckCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';
import { downloadPaymentReminder } from '../utils/calendar';

const TabButton = ({ active, onClick, children, count, color }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${active
            ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/30`
            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
    >
        {children}
        {count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {count}
            </span>
        )}
    </button>
);

const Collections = () => {
    const navigate = useNavigate();
    const { alerts, loading } = useLoans();
    const [activeTab, setActiveTab] = useState('overdue'); // 'overdue' | 'upcoming'
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) return <div className="p-8">Cargando...</div>;

    const allAlerts = alerts;

    // Filter alerts based on active tab
    const overduePayments = allAlerts.filter(a => a.type === 'overdue');
    const upcomingPayments = allAlerts.filter(a => a.type === 'upcoming');

    const displayedPayments = activeTab === 'overdue' ? overduePayments : upcomingPayments;

    // Filter by search term
    const filteredPayments = displayedPayments.filter(payment =>
        payment.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTotalAmount = (payments) => payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gestión de Cobranza</h2>
                    <p className="text-slate-500">Administra los pagos vencidos y próximos a vencer.</p>
                </div>
            </header>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                    <div>
                        <p className="text-red-600 dark:text-red-400 font-medium mb-1">Total Vencido</p>
                        <h3 className="text-3xl font-bold text-red-700 dark:text-red-300">
                            ${getTotalAmount(overduePayments).toLocaleString()}
                        </h3>
                        <p className="text-sm text-red-500 mt-2">{overduePayments.length} pagos pendientes</p>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400 shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                    <div>
                        <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">Próximos Cobros (30 días)</p>
                        <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            ${getTotalAmount(upcomingPayments).toLocaleString()}
                        </h3>
                        <p className="text-sm text-blue-500 mt-2">{upcomingPayments.length} pagos programados</p>
                    </div>
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                        <Calendar size={32} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl">
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
                        Próximos
                    </TabButton>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {filteredPayments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No hay pagos {activeTab === 'overdue' ? 'vencidos' : 'próximos'} encontrados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredPayments.map((item, index) => {
                            const phone = item.clientPhone || '';
                            const reminderMsg = getReminderMessage(item.clientName, item.amount, item.dueDate, item.type, {
                                loanId: item.loanId
                            });

                            return (
                                <div key={index} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col md:flex-row items-center gap-4">
                                    <button
                                        onClick={() => downloadPaymentReminder(item, item.clientName, { loanId: item.loanId })}
                                        title="Descargar recordatorio de calendario"
                                        className={`p-3 rounded-full transition-colors ${activeTab === 'overdue'
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                            : 'bg-blue-50 text-blue-500 hover:bg-blue-100'
                                            }`}
                                    >
                                        <Calendar size={20} />
                                    </button>

                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="font-semibold text-slate-800 dark:text-white">{item.clientName}</h4>
                                        <p className={`text-sm ${activeTab === 'overdue' ? 'text-red-500' : 'text-blue-500'}`}>
                                            {activeTab === 'overdue'
                                                ? `Venció hace ${item.daysOverdue} días`
                                                : `Vence en ${item.daysUntil} días`
                                            }
                                            <span className="text-slate-400 mx-2">•</span>
                                            <span className="text-slate-500">{format(parseISO(item.dueDate), 'd MMMM yyyy', { locale: es })}</span>
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-lg text-slate-800 dark:text-white">
                                            ${item.amount.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Monto a pagar</div>
                                    </div>

                                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                        {phone && (
                                            <a
                                                href={generateWhatsAppLink(phone, reminderMsg)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                                            >
                                                <MessageCircle size={18} />
                                                <span className="md:hidden">WhatsApp</span>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => navigate(`/loans/${item.loanId}`)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <span>Ver Préstamo</span>
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
