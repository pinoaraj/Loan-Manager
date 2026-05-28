import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-slate-900"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-emerald-500" />
                        Registrar Pago
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Total Cuota:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">${totalDue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Pagado hasta ahora:</span>
                            <span className="font-bold text-emerald-600">${paidSoFar.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-100 dark:border-blue-800/50 flex justify-between font-bold text-lg">
                            <span className="text-blue-700 dark:text-blue-400">Restante:</span>
                            <span className="text-blue-700 dark:text-blue-400">${remaining.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Monto a Pagar
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    max={remaining + 0.01} // tolerance
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Método
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    >
                                        <option value="Cash">Efectivo</option>
                                        <option value="Transfer">Transferencia</option>
                                        <option value="Card">Tarjeta</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Nota (Opcional)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                    placeholder="Detalles del pago..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
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
