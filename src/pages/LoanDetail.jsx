import React, { useState, useMemo, Fragment } from 'react';
import { useLoans } from '../context/LoanContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    User,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText,
    TrendingUp,
    MessageCircle,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format, parseISO, isAfter, addDays, differenceInDays } from 'date-fns';
import { downloadCalendarReminder, openGoogleCalendar } from '../utils/calendar';
import { generateLoanContract, generateReceipt } from '../utils/pdfGenerator';
import { generateWordContract, generateWordReceipt, generatePagare } from '../utils/wordGenerator';
import PagareModal from '../components/PagareModal';
import PaymentModal from '../components/PaymentModal';

const LoanDetail = () => {
    const { id: loanId } = useParams();
    const navigate = useNavigate();
    const { loans, clients, updatePaymentStatus, recalculateLoan, registerPayment } = useLoans();
    const [isPagareModalOpen, setIsPagareModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [expandedPaymentId, setExpandedPaymentId] = useState(null);

    const loan = useMemo(() => loans.find(l => l.id === loanId), [loans, loanId]);
    const client = useMemo(() => clients.find(c => c.id === loan?.clientId), [clients, loan]);

    if (!loan) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500">Préstamo no encontrado.</p>
                <button onClick={() => navigate('/loans')} className="mt-4 text-blue-600 font-bold hover:underline">Volver</button>
            </div>
        );
    }

    const paidPayments = loan.payments.filter(p => p.status === 'Paid');
    const pendingPayments = loan.payments.filter(p => p.status === 'Pending');
    const totalPaid = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRemaining = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const progress = (paidPayments.length / loan.payments.length) * 100;

    const handlePaymentToggle = async (paymentId, currentStatus) => {
        const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
        await updatePaymentStatus(paymentId, newStatus);
    };

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
        setIsPaymentModalOpen(true);
    };

    const handleRegisterPayment = async (paymentId, data) => {
        const result = await registerPayment(paymentId, data);
        if (result.success) {
            // Success logic if needed
        } else {
            alert(result.error);
        }
    };

    const sendWhatsAppReminder = (payment) => {
        if (!client?.phone) {
            alert('El cliente no tiene un número de teléfono registrado.');
            return;
        }

        const dueDate = format(parseISO(payment.dueDate), 'dd/MM/yyyy');
        const message = `Hola ${client.name}, le recordamos que su pago de $${payment.amount.toLocaleString()} del préstamo #${loan.id.slice(-6)} vence el ${dueDate}.`;
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = client.phone.replace(/\D/g, '');

        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const handleRecalculate = async () => {
        if (confirm('¿Estás seguro? Esto eliminará todos los pagos existentes y regenerará el calendario basándose en los datos del préstamo. Esta acción no se puede deshacer.')) {
            const success = await recalculateLoan(loan.id);
            if (success) {
                alert('Calendario recalculado exitosamente.');
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-start">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/loans')}
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold uppercase text-xs tracking-widest">Volver a Préstamos</span>
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            Préstamo <span className="text-slate-400 font-mono text-xl">#{loan.id.slice(-6)}</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-2 text-slate-500">
                            <User size={16} />
                            <span className="font-medium">{client?.name}</span>
                            <span className="mx-2">•</span>
                            <Calendar size={16} />
                            <span>Iniciado el {format(parseISO(loan.startDate), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecalculate}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                        title="Regenerar pagos con la fórmula corregida"
                    >
                        <RefreshCw size={16} />
                        Recalcular
                    </button>
                    <div className="flex bg-slate-800 rounded-xl overflow-hidden shadow-md shadow-slate-200/50">
                        <button
                            onClick={() => generateLoanContract(loan, client)}
                            className="flex items-center gap-2 px-4 py-2 text-white font-bold hover:bg-slate-700 transition-all text-sm border-r border-slate-700"
                            title="Descargar Contrato PDF"
                        >
                            <FileText size={16} />
                            Contrato PDF
                        </button>
                        <button
                            onClick={() => generateWordContract(loan, client)}
                            className="flex items-center gap-2 px-3 py-2 text-white font-bold hover:bg-slate-700 transition-all text-sm"
                            title="Descargar Contrato Word (Editable)"
                        >
                            <FileText size={16} className="text-blue-400" />
                            Word
                        </button>
                    </div>
                    <button
                        onClick={() => setIsPagareModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all text-sm shadow-md"
                        title="Descargar Pagaré"
                    >
                        <FileText size={16} />
                        Pagaré
                    </button>
                    <span className={`px-4 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider ${loan.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        loan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {loan.status}
                    </span>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Monto Original</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${loan.amount.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Pagado</p>
                    <h3 className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Pendiente</p>
                    <h3 className="text-2xl font-bold text-blue-600">${totalRemaining.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Progreso</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-bold text-slate-700">{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                        <h4 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-6">Detalles Técnicos</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Tipo de Préstamo</span>
                                <span className="font-bold">{loan.loanType}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Frecuencia de Pago</span>
                                <span className="font-bold capitalize">{loan.frequency}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Tasa de Interés</span>
                                <span className="font-bold">{(loan.interestRate * 100).toFixed(1)}% (Por Periodo)</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Duración</span>
                                <span className="font-bold">{loan.durationMonths} Meses</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Total Cuotas</span>
                                <span className="font-bold">{loan.payments.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <h4 className="text-blue-700 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Próximo Pago
                        </h4>
                        {pendingPayments.length > 0 ? (
                            <div>
                                <p className="text-2xl font-bold text-blue-900">
                                    ${pendingPayments[0].amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Vence el {format(parseISO(pendingPayments[0].dueDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                        ) : (
                            <p className="text-blue-700 font-medium">¡Préstamo pagado en su totalidad!</p>
                        )}
                    </div>
                </div>

                {/* Payments Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Cronograma de Pagos
                        </h4>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> PAGADO
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <div className="w-2 h-2 rounded-full bg-slate-200" /> PENDIENTE
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-600">#</th>
                                        <th className="p-4 font-bold text-slate-600">Fecha de Vencimiento</th>
                                        <th className="p-4 font-bold text-slate-600 text-right">Monto</th>
                                        <th className="p-4 font-bold text-slate-600 text-center">Estado</th>
                                        <th className="p-4 font-bold text-slate-600 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loan.payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map((p, idx) => (
                                        <Fragment key={p.id}>
                                            <tr className={`transition-colors ${p.status === 'Paid' ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                                <td className="p-4 font-medium text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        {p.transactions && p.transactions.length > 0 && (
                                                            <button
                                                                onClick={() => setExpandedPaymentId(expandedPaymentId === p.id ? null : p.id)}
                                                                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                                                            >
                                                                {expandedPaymentId === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </button>
                                                        )}
                                                        {idx + 1}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-slate-700">
                                                        {format(parseISO(p.dueDate), 'dd MMM yyyy')}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-mono italic">
                                                        Cap: ${p.principal.toFixed(2)} | Int: ${p.interest.toFixed(2)}
                                                        {p.lateFee > 0 && <span className="text-rose-500 font-bold ml-1">| Mora: ${p.lateFee.toFixed(2)}</span>}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-slate-800 dark:text-white">${(p.amount + (p.lateFee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        {p.lateFee > 0 && <span className="text-[10px] text-rose-500 font-bold">Incl. Mora</span>}

                                                        {/* Progress for partial payments */}
                                                        {(p.paidAmount > 0 && p.status !== 'Paid') && (
                                                            <div className="w-24 mt-1">
                                                                <div className="flex justify-between text-[10px] text-emerald-600 mb-0.5 font-bold">
                                                                    <span>${p.paidAmount.toLocaleString()}</span>
                                                                    <span>{(p.paidAmount / (p.amount + (p.lateFee || 0)) * 100).toFixed(0)}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500 rounded-full"
                                                                        style={{ width: `${(p.paidAmount / (p.amount + (p.lateFee || 0)) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                            p.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        {p.status === 'Paid' ? 'PAGADO' : p.status === 'Partial' ? 'PARCIAL' : 'PENDIENTE'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => sendWhatsAppReminder(p)}
                                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all shadow-sm"
                                                        title="Enviar recordatorio por WhatsApp"
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                    {p.status === 'Paid' && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => generateReceipt(p, loan, client)}
                                                                className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition-all shadow-sm"
                                                                title="Descargar Recibo PDF"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => generateWordReceipt(p, loan, client)}
                                                                className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                                                title="Descargar Recibo Word"
                                                            >
                                                                <FileText size={18} className="text-blue-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => openGoogleCalendar(p, client?.name || 'Cliente')}
                                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                                        title="Agregar a Google Calendar"
                                                    >
                                                        <Calendar size={18} />
                                                    </button>

                                                    {p.status !== 'Paid' && (
                                                        <button
                                                            onClick={() => handlePaymentClick(p)}
                                                            className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all shadow-sm"
                                                            title="Registrar Pago"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedPaymentId === p.id && p.transactions && (
                                                <tr className="bg-slate-50/30">
                                                    <td colSpan="5" className="p-4 pl-12 shadow-inner">
                                                        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                                            <h5 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
                                                                <Clock size={12} />
                                                                Historial de Pagos
                                                            </h5>
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-slate-500 border-b border-slate-100">
                                                                        <th className="pb-2 text-left">Fecha Realizada</th>
                                                                        <th className="pb-2 text-left">Registrado El (Sistema)</th>
                                                                        <th className="pb-2 text-left">Método</th>
                                                                        <th className="pb-2 text-left">Nota</th>
                                                                        <th className="pb-2 text-right">Monto</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="text-slate-600">
                                                                    {p.transactions.map((tx) => (
                                                                        <tr key={tx.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                                            <td className="py-2.5 font-medium">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                                                                            <td className="py-2.5 text-slate-400">{format(parseISO(tx.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                                                                            <td className="py-2.5 capitalize">{tx.method}</td>
                                                                            <td className="py-2.5 text-slate-500 italic max-w-[200px] truncate" title={tx.note}>{tx.note || '-'}</td>
                                                                            <td className="py-2.5 text-right font-bold text-emerald-600">${tx.amount.toLocaleString()}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <PagareModal
                isOpen={isPagareModalOpen}
                onClose={() => setIsPagareModalOpen(false)}
                loan={loan}
                client={client}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                payment={selectedPayment}
                onRegisterPayment={handleRegisterPayment}
            />
        </div >
    );
};

export default LoanDetail;
