import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, AlertCircle, FileText, RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useLoans } from '../context/useLoans';
import { useLoanHealth } from '../hooks/useLoanHealth';
import { downloadLoanCalendar } from '../utils/calendar';
import { useAuth } from '../context/useAuth';
import { API_URL } from '../config/api';

const PagareModal = lazy(() => import('../components/PagareModal'));
const PaymentModal = lazy(() => import('../components/PaymentModal'));
const PaymentScheduleTable = lazy(() => import('../components/PaymentScheduleTable'));

const HEALTH_BADGE_CLASSES = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-700'
};

const HEALTH_TEXT_CLASSES = {
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    slate: 'text-slate-700'
};

const HEALTH_PANEL_CLASSES = {
    emerald: 'border-emerald-100 bg-emerald-50',
    rose: 'border-rose-100 bg-rose-50',
    blue: 'border-blue-100 bg-blue-50',
    amber: 'border-amber-100 bg-amber-50',
    slate: 'border-slate-100 bg-slate-50'
};

const SectionLoader = () => (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        Cargando seccion...
    </div>
);

const LoanDetail = () => {
    const { id: loanId } = useParams();
    const navigate = useNavigate();
    const { loans, clients, recalculateLoan, registerPayment, togglePause } = useLoans();
    const { token, fetchWithAuth } = useAuth();
    const { getLoanHealth } = useLoanHealth();

    const [isPagareModalOpen, setIsPagareModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    const { data: fetchedLoan, isLoading } = useQuery({
        queryKey: ['loan-detail', loanId],
        queryFn: async () => {
            const response = await fetchWithAuth(`${API_URL}/loans/${loanId}`);
            if (!response.ok) {
                throw new Error('No se pudo cargar el prestamo');
            }
            return response.json();
        },
        enabled: !!loanId && !!token && typeof fetchWithAuth === 'function'
    });

    const loan = useMemo(
        () => fetchedLoan || loans.find((item) => item.id === loanId),
        [fetchedLoan, loans, loanId]
    );
    const client = useMemo(() => {
        if (fetchedLoan?.client) {
            return fetchedLoan.client;
        }
        return clients.find((item) => item.id === loan?.clientId);
    }, [clients, fetchedLoan, loan]);

    if (isLoading && !loan) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Cargando prestamo...</p>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="mx-auto mb-4 text-slate-300" size={48} />
                <p className="text-slate-500">Prestamo no encontrado.</p>
                <button onClick={() => navigate('/loans')} className="mt-4 font-bold text-blue-600 hover:underline">Volver</button>
            </div>
        );
    }

    const health = getLoanHealth(loan);
    const badgeClasses = HEALTH_BADGE_CLASSES[health.color] || HEALTH_BADGE_CLASSES.slate;
    const healthTextClass = HEALTH_TEXT_CLASSES[health.color] || HEALTH_TEXT_CLASSES.slate;
    const healthPanelClass = HEALTH_PANEL_CLASSES[health.color] || HEALTH_PANEL_CLASSES.slate;
    const totalPaid = loan.payments.reduce((acc, payment) => acc + Number(payment.paidAmount || 0), 0);
    const totalRemaining = loan.payments.reduce(
        (acc, payment) => acc + Math.max(0, Number(payment.amount) + Number(payment.lateFee || 0) - Number(payment.paidAmount || 0)),
        0
    );
    const totalScheduled = loan.payments.reduce(
        (acc, payment) => acc + Number(payment.amount) + Number(payment.lateFee || 0),
        0
    );
    const progress = totalScheduled > 0 ? (totalPaid / totalScheduled) * 100 : 0;

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
        setIsPaymentModalOpen(true);
    };

    const handleRegisterPayment = async (paymentId, data) => {
        const result = await registerPayment(paymentId, data);
        if (result.success) {
            toast.success('Pago registrado correctamente');
            return;
        }

        toast.error(result.error);
    };

    const handleRecalculate = async () => {
        const shouldContinue = confirm(
            'Estas seguro? Esto eliminara todos los pagos existentes y regenerara el calendario basandose en los datos del prestamo. Esta accion no se puede deshacer.'
        );

        if (!shouldContinue) {
            return;
        }

        const result = await recalculateLoan(loan.id);
        if (result.success) {
            downloadLoanCalendar(result.data, result.data?.client || client);
            toast.success('Calendario recalculado y recordatorios descargados.');
            return;
        }

        toast.error('Error al recalcular el calendario.');
    };

    const handleTogglePause = async () => {
        const action = loan.isPaused ? 'reanudar' : 'pausar';
        const shouldContinue = confirm(`Estas seguro de que quieres ${action} este prestamo?`);

        if (!shouldContinue) {
            return;
        }

        await togglePause(loan.id, !loan.isPaused);
        toast.success(`Prestamo ${loan.isPaused ? 'reanudado' : 'pausado'} correctamente`);
    };

    const handleGeneratePdfContract = async () => {
        const { generateLoanContract } = await import('../utils/pdfGenerator');
        generateLoanContract(loan, client);
    };

    const handleGenerateWordContract = async () => {
        const { generateWordContract } = await import('../utils/wordGenerator');
        await generateWordContract(loan, client);
    };

    const handleDownloadCalendar = () => {
        const downloaded = downloadLoanCalendar(loan, client);
        if (!downloaded) {
            toast.error('No hay cobros para generar en el calendario.');
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-8">
            <header className="flex items-start justify-between">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/loans')}
                        className="group flex items-center gap-2 text-slate-500 transition-colors hover:text-blue-600"
                    >
                        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-xs font-bold uppercase tracking-widest">Volver a Prestamos</span>
                    </button>
                    <div>
                        <h2 className="flex items-center gap-3 text-3xl font-bold text-slate-800 dark:text-white">
                            Prestamo <span className="font-mono text-xl text-slate-400">#{loan.id.slice(-6)}</span>
                            <span className={`rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wider ${badgeClasses}`}>
                                {health.label}
                            </span>
                        </h2>
                        <div className="mt-2 flex items-center gap-2 text-slate-500">
                            <User size={16} />
                            <span className="font-medium">{client?.name}</span>
                            <span className="mx-2">-</span>
                            <Calendar size={16} />
                            <span>Iniciado el {format(parseISO(loan.startDate), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTogglePause}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${loan.isPaused
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        title={loan.isPaused ? 'Reanudar prestamo' : 'Pausar prestamo'}
                    >
                        {loan.isPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                        {loan.isPaused ? 'Reanudar' : 'Pausar'}
                    </button>

                    <button
                        onClick={handleRecalculate}
                        className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                        title="Regenerar pagos con la formula corregida"
                    >
                        <RefreshCw size={16} />
                        Recalcular
                    </button>
                    <div className="flex overflow-hidden rounded-xl bg-slate-800 shadow-md shadow-slate-200/50">
                        <button
                            onClick={handleGeneratePdfContract}
                            className="flex items-center gap-2 border-r border-slate-700 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-700"
                            title="Descargar Contrato PDF"
                        >
                            <FileText size={16} />
                            Contrato PDF
                        </button>
                        <button
                            onClick={handleGenerateWordContract}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white transition-all hover:bg-slate-700"
                            title="Descargar Contrato Word (Editable)"
                        >
                            <FileText size={16} className="text-blue-400" />
                            Word
                        </button>
                    </div>
                    <button
                        onClick={handleDownloadCalendar}
                        className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-100"
                        title="Descargar calendario de cobros"
                    >
                        <Calendar size={16} />
                        Calendario
                    </button>
                    <button
                        onClick={() => setIsPagareModalOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-700"
                        title="Abrir documentos legales"
                    >
                        <FileText size={16} />
                        Documentos
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Monto Original</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${loan.amount.toLocaleString()}</h3>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Pagado</p>
                    <h3 className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</h3>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Pendiente</p>
                    <h3 className="text-2xl font-bold text-blue-600">${totalRemaining.toLocaleString()}</h3>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Progreso</p>
                    <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-bold text-slate-700">{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-1">
                    <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
                        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-blue-400">Detalles Tecnicos</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Tipo de Prestamo</span>
                                <span className="font-bold">{loan.loanType}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Frecuencia de Pago</span>
                                <span className="font-bold capitalize">{loan.frequency}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Tasa de Interes</span>
                                <span className="font-bold">{(loan.interestRate * 100).toFixed(1)}% (Por Periodo)</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Duracion</span>
                                <span className="font-bold">{loan.durationMonths} Meses</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Total Cuotas</span>
                                <span className="font-bold">{loan.payments.length}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-sm">
                                <span className="text-slate-400">Estado de Salud</span>
                                <span className={`font-bold ${healthTextClass}`}>{health.label}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-3xl border p-6 ${healthPanelClass}`}>
                        <h4 className={`mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${healthTextClass}`}>
                            <AlertCircle size={16} />
                            Estado del Prestamo
                        </h4>
                        <p className={`font-medium ${healthTextClass}`}>
                            {health.description}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                            <Calendar size={20} className="text-blue-600" />
                            Cronograma de Pagos
                        </h4>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" /> PAGADO
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <div className="h-2 w-2 rounded-full bg-slate-200" /> PENDIENTE
                            </span>
                        </div>
                    </div>

                    <Suspense fallback={<SectionLoader />}>
                        <PaymentScheduleTable loan={loan} client={client} onRegisterPayment={handlePaymentClick} />
                    </Suspense>
                </div>
            </div>

            <Suspense fallback={null}>
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
            </Suspense>
        </div>
    );
};

export default LoanDetail;
