import React, { useState } from 'react';
import { useLoans } from '../context/useLoans';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/useAuth';
import ConfirmModal from '../components/ConfirmModal';
import { useLoanHealth } from '../hooks/useLoanHealth';
import { API_URL } from '../config/api';

const HEALTH_BADGE_CLASSES = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-700'
};

const getPaymentDetailPath = (loanId, paymentId) => paymentId
    ? `/loans/${loanId}?payment=${paymentId}`
    : `/loans/${loanId}`;

const Loans = () => {
    const navigate = useNavigate();
    const { updateLoanStatus } = useLoans();
    const { token, fetchWithAuth } = useAuth();
    const { getLoanHealth } = useLoanHealth();

    const [page, setPage] = useState(1);
    const limit = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmLoanId, setConfirmLoanId] = useState(null);
    const [expandedLoanId, setExpandedLoanId] = useState(null);

    const { data: loansData = { data: [], meta: {} }, refetch } = useQuery({
        queryKey: ['loans', page, limit, searchTerm, statusFilter],
        queryFn: async () => {
            const response = await fetchWithAuth(`${API_URL}/loans?page=${page}&limit=${limit}&search=${searchTerm}&status=${statusFilter}`);
            return response.json();
        },
        keepPreviousData: true,
        enabled: !!token && typeof fetchWithAuth === 'function'
    });

    const loans = loansData.data || [];
    const meta = loansData.meta || {};

    const handleMarkAsPaid = (loanId) => {
        setConfirmLoanId(loanId);
        setIsConfirmOpen(true);
    };

    const confirmPayment = async () => {
        if (confirmLoanId) {
            await updateLoanStatus(confirmLoanId, 'Paid');
            setConfirmLoanId(null);
            refetch();
        }
    };

    const getClientName = (loan) => loan.client?.name || 'Desconocido';
    const toggleLoan = (loanId) => setExpandedLoanId(expandedLoanId === loanId ? null : loanId);
    const getUpcomingPayments = (loan) => [...(loan.payments || [])]
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .filter((payment) => payment.status !== 'Paid');

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white sm:text-3xl">Prestamos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-300 sm:text-base">Seguimiento de prestamos y pagos.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
                    <div className="relative min-w-0 flex-1 sm:min-w-[16rem]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente o ID..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setPage(1);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <option value="All">Todos los Estados</option>
                        <option value="Active">Activos</option>
                        <option value="Paid">Pagados</option>
                        <option value="Overdue">Vencidos</option>
                    </select>
                </div>
            </header>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[52rem] text-left">
                        <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">Cliente</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">Monto</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">Interes</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">Inicio</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-100">Estado</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-300">
                                        No se encontraron prestamos que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                loans.map((loan) => {
                                    const health = getLoanHealth(loan);
                                    const badgeClasses = HEALTH_BADGE_CLASSES[health.color] || HEALTH_BADGE_CLASSES.slate;
                                    const upcomingPayments = getUpcomingPayments(loan);
                                    const nextPayment = upcomingPayments[0];

                                    return (
                                        <React.Fragment key={loan.id}>
                                            <tr
                                                className={`cursor-pointer transition-colors ${expandedLoanId === loan.id ? 'bg-slate-50 dark:bg-slate-700/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/30'}`}
                                                onClick={() => toggleLoan(loan.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {expandedLoanId === loan.id
                                                            ? <ChevronUp size={16} className="text-slate-400" />
                                                            : <ChevronDown size={16} className="text-slate-400" />}
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">{getClientName(loan)}</div>
                                                            <div className="font-mono text-xs text-slate-500 dark:text-slate-300">{loan.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-semibold text-slate-800 dark:text-white">
                                                    ${Number(loan.amount || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                                                    {(Number(loan.interestRate || 0) * 100).toFixed(0)}%
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-200">
                                                    {new Date(loan.startDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeClasses}`}>
                                                        {health.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                                                        {loan.status === 'Active' && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(loan.id)}
                                                                className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                            >
                                                                Pagado
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate(getPaymentDetailPath(loan.id, nextPayment?.id))}
                                                            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-300 dark:hover:bg-slate-700"
                                                        >
                                                            Detalle
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandedLoanId === loan.id && (
                                                <tr>
                                                    <td colSpan="6" className="border-b border-slate-100 bg-slate-50 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/40">
                                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                                            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-700 dark:text-slate-100">
                                                                <Calendar size={14} />
                                                                Proximos Pagos
                                                            </h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full min-w-[28rem] text-left text-sm">
                                                                    <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                                                        <tr>
                                                                            <th className="px-4 py-2">Fecha</th>
                                                                            <th className="px-4 py-2 text-right">Monto</th>
                                                                            <th className="px-4 py-2 text-center">Estado</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {upcomingPayments.length > 0 ? (
                                                                            upcomingPayments.slice(0, 5).map((payment) => (
                                                                                <tr
                                                                                    key={payment.id}
                                                                                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-blue-50/60 dark:border-slate-700 dark:hover:bg-slate-700/50"
                                                                                    onClick={() => navigate(getPaymentDetailPath(loan.id, payment.id))}
                                                                                >
                                                                                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                                                                                        {new Date(payment.dueDate).toLocaleDateString()}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-white">
                                                                                        ${Number(payment.amount || 0).toLocaleString()}
                                                                                    </td>
                                                                                    <td className="px-4 py-2 text-center">
                                                                                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${payment.status === 'Overdue'
                                                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                                                                                            : payment.status === 'Partial'
                                                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                                                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                                                                            }`}>
                                                                                            {payment.status}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="3" className="px-4 py-3 text-center text-slate-500 dark:text-slate-300">
                                                                                    No hay pagos pendientes registrados.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="mt-2 text-right">
                                                                <button
                                                                    onClick={() => navigate(getPaymentDetailPath(loan.id, nextPayment?.id))}
                                                                    className="text-xs font-bold text-blue-700 hover:underline dark:text-blue-300"
                                                                >
                                                                    Ver Cronograma Completo →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
                <button
                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                >
                    <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                    Pagina {page} {meta.totalPages ? `de ${meta.totalPages}` : ''}
                </span>
                <button
                    onClick={() => {
                        if (!meta.totalPages || page < meta.totalPages) {
                            setPage((old) => old + 1);
                        }
                    }}
                    disabled={meta.totalPages ? page >= meta.totalPages : false}
                    className="rounded-lg border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                >
                    <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmPayment}
                title="Confirmar Pago"
                message="Estas seguro de que quieres marcar este prestamo como pagado? Esta accion no se puede deshacer facilmente."
                confirmText="Si, Marcar como Pagado"
                type="success"
            />
        </div>
    );
};

export default Loans;
