import React, { useState } from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Clock, Search, Filter } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const Loans = () => {
    const navigate = useNavigate();
    const { loans, clients, updateLoanStatus } = useLoans();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState(null);

    const getClientName = (id) => clients.find(c => c.id === id)?.name || 'Desconocido';

    const handleMarkAsPaid = (loanId) => {
        setSelectedLoanId(loanId);
        setIsConfirmOpen(true);
    };

    const confirmPayment = () => {
        if (selectedLoanId) {
            updateLoanStatus(selectedLoanId, 'Paid');
            setSelectedLoanId(null);
        }
    };

    const filteredLoans = loans.filter(loan => {
        const clientName = getClientName(loan.clientId).toLowerCase();
        const matchesSearch = clientName.includes(searchTerm.toLowerCase()) || loan.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || loan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                        {filteredLoans.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                                    No se encontraron préstamos que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            filteredLoans.map(loan => (
                                <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{getClientName(loan.clientId)}</div>
                                        <div className="text-xs text-slate-400 font-mono">{loan.id}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-700 font-semibold">${loan.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-600">{(loan.interestRate * 100).toFixed(0)}%</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{loan.startDate}</td>
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
                                        <div className="flex justify-end gap-2">
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
                            ))
                        )}
                    </tbody>
                </table>
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
