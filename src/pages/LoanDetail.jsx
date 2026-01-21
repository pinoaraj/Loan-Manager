import React, { useState, useMemo } from 'react';
import { useLoans } from '../context/LoanContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    User,
    AlertCircle,
    FileText,
    RefreshCw,
    PauseCircle,
    PlayCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateLoanContract } from '../utils/pdfGenerator';
import { generateWordContract } from '../utils/wordGenerator';
import PagareModal from '../components/PagareModal';
import PaymentModal from '../components/PaymentModal';
import PaymentScheduleTable from '../components/PaymentScheduleTable';
import { useLoanHealth } from '../hooks/useLoanHealth';

import { toast } from 'sonner';

const LoanDetail = () => {
    const { id: loanId } = useParams();
    const navigate = useNavigate();
    const { loans, clients, updatePaymentStatus, recalculateLoan, registerPayment, togglePause } = useLoans();
    const { getLoanHealth } = useLoanHealth();

    const [isPagareModalOpen, setIsPagareModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

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

    const health = getLoanHealth(loan);

    const paidPayments = loan.payments.filter(p => p.status === 'Paid');
    const pendingPayments = loan.payments.filter(p => p.status === 'Pending');
    const totalPaid = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRemaining = pendingPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const progress = (paidPayments.length / loan.payments.length) * 100;

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
        setIsPaymentModalOpen(true);
    };

    const handleRegisterPayment = async (paymentId, data) => {
        const result = await registerPayment(paymentId, data);
        if (result.success) {
            toast.success('Pago registrado correctamente');
        } else {
            toast.error(result.error);
        }
    };

    const handleRecalculate = async () => {
        if (confirm('¿Estás seguro? Esto eliminará todos los pagos existentes y regenerará el calendario basándose en los datos del préstamo. Esta acción no se puede deshacer.')) {
            const success = await recalculateLoan(loan.id);
            if (success) {
                toast.success('Calendario recalculado exitosamente.');
            } else {
                toast.error('Error al recalcular el calendario.');
            }
        }
    };

    const handleTogglePause = async () => {
        const action = loan.isPaused ? 'reanudar' : 'pausar';
        if (confirm(`¿Estás seguro de que quieres ${action} este préstamo?`)) {
            await togglePause(loan.id, !loan.isPaused);
            toast.success(`Préstamo ${loan.isPaused ? 'reanudado' : 'pausado'} correctamente`);
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
                            {/* Health Badge */}
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-${health.color}-100 text-${health.color}-700`}>
                                {health.label}
                            </span>
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
                        onClick={handleTogglePause}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm border ${loan.isPaused
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        title={loan.isPaused ? "Reanudar préstamo" : "Pausar préstamo"}
                    >
                        {loan.isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                        {loan.isPaused ? 'Reanudar' : 'Pausar'}
                    </button>

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
                            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                                <span className="text-slate-400">Estado de Salud</span>
                                <span className={`font-bold text-${health.color}-400`}>{health.label}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-3xl border border-${health.color}-100 bg-${health.color}-50`}>
                        <h4 className={`text-${health.color}-700 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2`}>
                            <AlertCircle size={16} />
                            Estado del Préstamo
                        </h4>
                        <p className={`text-${health.color}-800 font-medium`}>
                            {health.description}
                        </p>
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

                    <PaymentScheduleTable
                        loan={loan}
                        client={client}
                        onRegisterPayment={handlePaymentClick}
                    />
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
