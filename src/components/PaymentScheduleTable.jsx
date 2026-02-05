import React, { useState, Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import {
    ChevronDown,
    ChevronUp,
    MessageCircle,
    FileText,
    Calendar,
    DollarSign,
    Clock
} from 'lucide-react';
import { generateReceipt } from '../utils/pdfGenerator';
import { generateWordReceipt } from '../utils/wordGenerator';
import { openGoogleCalendar } from '../utils/calendar';

const PaymentScheduleTable = ({ loan, client, onRegisterPayment }) => {
    const [expandedPaymentId, setExpandedPaymentId] = useState(null);

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

    return (
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
                                            {((p.transactions && p.transactions.length > 0) || p.status === 'Partial' || p.status === 'Paid') && (
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
                                        <div className="group relative inline-block">
                                            <span className={`cursor-help px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                p.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-400'
                                                }`}>
                                                {p.status === 'Paid' ? 'PAGADO' : p.status === 'Partial' ? 'PARCIAL' : 'PENDIENTE'}
                                            </span>

                                            {/* Tooltip for Remaining Balance (Partial) */}
                                            {p.status === 'Partial' && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                    Restan: ${((p.amount + (p.lateFee || 0)) - p.paidAmount).toLocaleString()}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                </div>
                                            )}
                                        </div>
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
                                                onClick={() => onRegisterPayment(p)}
                                                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all shadow-sm"
                                                title="Registrar Pago"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {expandedPaymentId === p.id && (
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
                                                        {p.transactions && p.transactions.length > 0 ? (
                                                            p.transactions.map((tx) => (
                                                                <tr key={tx.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                                    <td className="py-2.5 font-medium">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                                                                    <td className="py-2.5 text-slate-400">{format(parseISO(tx.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                                                                    <td className="py-2.5 capitalize">{tx.method}</td>
                                                                    <td className="py-2.5 text-slate-500 italic max-w-[200px] truncate" title={tx.note}>{tx.note || '-'}</td>
                                                                    <td className="py-2.5 text-right font-bold text-emerald-600">${tx.amount.toLocaleString()}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="py-4 text-center text-slate-400 italic">
                                                                    No hay detalles de transacciones disponibles para este pago.
                                                                </td>
                                                            </tr>
                                                        )}
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
    );
};

export default PaymentScheduleTable;
