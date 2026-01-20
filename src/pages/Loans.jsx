import React, { useState } from 'react';
import { useLoans } from '../context/LoanContext';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const Loans = () => {
    const navigate = useNavigate();
    const { updateLoanStatus } = useLoans();
    const { token } = useAuth();

    // State
    const [page, setPage] = useState(1);
    const limit = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState(null);

    // Fetch Loans with Pagination & Filtering
    const { data: loansData = { data: [], meta: {} }, isLoading, refetch } = useQuery({
        queryKey: ['loans', page, limit, searchTerm, statusFilter], // Refetch when these change
        queryFn: async () => {
            // Debounce search in real app, but for now direct
            const res = await fetch(`http://localhost:3001/api/loans?page=${page}&limit=${limit}&search=${searchTerm}&status=${statusFilter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.json();
        },
        keepPreviousData: true,
        enabled: !!token
    });

    const loans = loansData.data || [];
    const meta = loansData.meta || {};

    const handleMarkAsPaid = (loanId) => {
        setSelectedLoanId(loanId);
        setIsConfirmOpen(true);
    };

    const confirmPayment = async () => {
        if (selectedLoanId) {
            await updateLoanStatus(selectedLoanId, 'Paid');
            setSelectedLoanId(null);
            refetch(); // Refresh list
        }
    };

    const getClientName = (loan) => loan.client?.name || 'Desconocido';

    // Start of the rendering logic
    const toggleLoan = (id) => {
        setSelectedLoanId(selectedLoanId === id ? null : id);
    };

    return (
        <div className="p-8 space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Préstamos</h2>
                    <p className="text-slate-500">Seguimiento de préstamos y pagos.</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente o ID..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1); // Reset to page 1 on filter change
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-600"
                    >
                        <option value="All">Todos los Estados</option>
                        <option value="Active">Activos</option>
                        <option value="Paid">Pagados</option>
                        <option value="Overdue">Vencidos</option>
                    </select>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Cliente</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Monto</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Interés</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Inicio</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Estado</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loans.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                                    No se encontraron préstamos que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            loans.map(loan => (
                                <React.Fragment key={loan.id}>
                                    <tr className={`cursor-pointer transition-colors ${selectedLoanId === loan.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`} onClick={() => toggleLoan(loan.id)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {selectedLoanId === loan.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                <div>
                                                    <div className="font-medium text-slate-900">{getClientName(loan)}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{loan.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-700 font-semibold">${loan.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-600">{(loan.interestRate * 100).toFixed(0)}%</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(loan.startDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${loan.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                                                loan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {loan.status === 'Active' ? 'Activo' :
                                                    loan.status === 'Paid' ? 'Pagado' :
                                                        loan.status === 'Overdue' ? 'Vencido' : loan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {loan.status === 'Active' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(loan.id)}
                                                        className="text-emerald-600 hover:text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-all border border-emerald-200 hover:border-emerald-500"
                                                    >
                                                        Pagado
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/loans/${loan.id}`)}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent"
                                                >
                                                    Detalle
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {selectedLoanId === loan.id && (
                                        <tr>
                                            <td colSpan="6" className="bg-slate-50 p-4 border-b border-slate-100 dark:border-slate-700 shadow-inner">
                                                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                                        <Calendar size={14} /> Próximos Pagos
                                                    </h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
                                                                <tr>
                                                                    <th className="px-4 py-2">Fecha</th>
                                                                    <th className="px-4 py-2 text-right">Monto</th>
                                                                    <th className="px-4 py-2 text-center">Estado</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {loan.payments && loan.payments.length > 0 ? (
                                                                    loan.payments.slice(0, 5).map(payment => (
                                                                        <tr key={payment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                                                            <td className="px-4 py-2">{new Date(payment.dueDate).toLocaleDateString()}</td>
                                                                            <td className="px-4 py-2 text-right font-medium">${payment.amount.toLocaleString()}</td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                                    payment.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                                                                                    }`}>
                                                                                    {payment.status}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="3" className="px-4 py-2 text-center text-slate-400">No hay pagos registrados.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-2 text-right">
                                                        <button
                                                            onClick={() => navigate(`/loans/${loan.id}`)}
                                                            className="text-xs text-blue-600 font-bold hover:underline"
                                                        >
                                                            Ver Cronograma Completo &rarr;
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
                <button
                    onClick={() => setPage(old => Math.max(old - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Página {page} {meta.totalPages ? `de ${meta.totalPages}` : ''}
                </span>
                <button
                    onClick={() => {
                        if (!meta.totalPages || page < meta.totalPages) {
                            setPage(old => old + 1);
                        }
                    }}
                    disabled={meta.totalPages ? page >= meta.totalPages : false}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmPayment}
                title="Confirmar Pago"
                message="¿Estás seguro de que quieres marcar este préstamo como pagado? Esta acción no se puede deshacer fácilmente."
                confirmText="Sí, Marcar como Pagado"
                type="success"
            />
        </div>
    );
};

export default Loans;
