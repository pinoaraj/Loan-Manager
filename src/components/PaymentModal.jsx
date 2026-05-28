import React, { useEffect, useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatters';

const PaymentModal = ({ isOpen, onClose, payment, onRegisterPayment }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [method, setMethod] = useState('Cash');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (payment && isOpen) {
            const remaining = (payment.amount + (payment.lateFee || 0)) - (payment.paidAmount || 0);
            setAmount(remaining.toFixed(2));
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setMethod('Cash');
            setNote('');
        }
    }, [payment, isOpen]);

    if (!isOpen || !payment) return null;

    const totalDue = payment.amount + (payment.lateFee || 0);
    const paidSoFar = payment.paidAmount || 0;
    const remaining = totalDue - paidSoFar;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        setIsSubmitting(true);
        try {
            await onRegisterPayment(payment.id, {
                amount: parseFloat(amount),
                date,
                method,
                note
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al registrar el pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="animate-in zoom-in fade-in w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl duration-200 dark:bg-slate-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                        <DollarSign className="text-emerald-500" />
                        Registrar Pago
                    </h3>
                    <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Total Cuota:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">${formatCurrency(totalDue, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Pagado hasta ahora:</span>
                            <span className="font-bold text-emerald-600">${formatCurrency(paidSoFar, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-100 pt-2 text-lg font-bold dark:border-blue-800/50">
                            <span className="text-blue-700 dark:text-blue-400">Restante:</span>
                            <span className="text-blue-700 dark:text-blue-400">${formatCurrency(remaining, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                Monto a Pagar
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    max={remaining + 0.01}
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Fecha
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(event) => setDate(event.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Metodo
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={method}
                                        onChange={(event) => setMethod(event.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="Cash">Efectivo</option>
                                        <option value="Transfer">Transferencia</option>
                                        <option value="Card">Tarjeta</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                Nota (Opcional)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="Detalles del pago..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Registrando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
