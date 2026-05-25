import React, { Fragment, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, MessageCircle, FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import { downloadPaymentReminder } from '../utils/calendar';
import { generateWhatsAppLink, getReminderMessage } from '../utils/communication';

const PaymentScheduleTable = ({ loan, client, onRegisterPayment }) => {
    const [expandedPaymentId, setExpandedPaymentId] = useState(null);

    const sendWhatsAppReminder = (payment) => {
        if (!client?.phone) {
            alert('El cliente no tiene un numero de telefono registrado.');
            return;
        }

        const paymentIndex = [...loan.payments]
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .findIndex((item) => item.id === payment.id);
        const message = getReminderMessage(client.name, payment.amount + (payment.lateFee || 0), payment.dueDate, 'upcoming', {
            loanId: loan.id,
            paymentNumber: paymentIndex + 1,
            totalPayments: loan.payments.length
        });
        const link = generateWhatsAppLink(client.phone, message);

        if (link) {
            window.open(link, '_blank');
        }
    };

    const handleGeneratePdfReceipt = async (payment) => {
        const { generateReceipt } = await import('../utils/pdfGenerator');
        generateReceipt(payment, loan, client);
    };

    const handleGenerateWordReceipt = async (payment) => {
        const { generateWordReceipt } = await import('../utils/wordGenerator');
        await generateWordReceipt(payment, loan, client);
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="custom-scrollbar max-h-[600px] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr>
                            <th className="p-4 font-bold text-slate-600">#</th>
                            <th className="p-4 font-bold text-slate-600">Fecha de Vencimiento</th>
                            <th className="p-4 text-right font-bold text-slate-600">Monto</th>
                            <th className="p-4 text-center font-bold text-slate-600">Estado</th>
                            <th className="p-4 text-right font-bold text-slate-600">Accion</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loan.payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map((payment, idx) => (
                            <Fragment key={payment.id}>
                                <tr className={`transition-colors ${payment.status === 'Paid' ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                    <td className="p-4 font-medium text-slate-400">
                                        <div className="flex items-center gap-2">
                                            {((payment.transactions && payment.transactions.length > 0) || payment.status === 'Partial' || payment.status === 'Paid') && (
                                                <button
                                                    onClick={() => setExpandedPaymentId(expandedPaymentId === payment.id ? null : payment.id)}
                                                    className="rounded-lg p-1 transition-colors hover:bg-slate-200"
                                                >
                                                    {expandedPaymentId === payment.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            )}
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-700">
                                            {format(parseISO(payment.dueDate), 'dd MMM yyyy')}
                                        </div>
                                        <p className="font-mono text-xs italic text-slate-400">
                                            Cap: ${payment.principal.toFixed(2)} | Int: ${payment.interest.toFixed(2)}
                                            {payment.lateFee > 0 && <span className="ml-1 font-bold text-rose-500">| Mora: ${payment.lateFee.toFixed(2)}</span>}
                                        </p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                ${(payment.amount + (payment.lateFee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            {payment.lateFee > 0 && <span className="text-[10px] font-bold text-rose-500">Incl. Mora</span>}

                                            {payment.paidAmount > 0 && payment.status !== 'Paid' && (
                                                <div className="mt-1 w-24">
                                                    <div className="mb-0.5 flex justify-between text-[10px] font-bold text-emerald-600">
                                                        <span>${payment.paidAmount.toLocaleString()}</span>
                                                        <span>{(payment.paidAmount / (payment.amount + (payment.lateFee || 0)) * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{ width: `${(payment.paidAmount / (payment.amount + (payment.lateFee || 0)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="group relative inline-block">
                                            <span className={`cursor-help rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tighter ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : payment.status === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                                {payment.status === 'Paid' ? 'PAGADO' : payment.status === 'Partial' ? 'PARCIAL' : 'PENDIENTE'}
                                            </span>

                                            {payment.status === 'Partial' && (
                                                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                    Restan: ${((payment.amount + (payment.lateFee || 0)) - payment.paidAmount).toLocaleString()}
                                                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="flex justify-end gap-2 p-4 text-right">
                                        <button
                                            onClick={() => sendWhatsAppReminder(payment)}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 shadow-sm transition-all hover:border-green-500 hover:bg-green-50 hover:text-green-500"
                                            title="Enviar recordatorio por WhatsApp"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                        {payment.status === 'Paid' && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleGeneratePdfReceipt(payment)}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 shadow-sm transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-500"
                                                    title="Descargar Recibo PDF"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateWordReceipt(payment)}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500"
                                                    title="Descargar Recibo Word"
                                                >
                                                    <FileText size={18} className="text-blue-500" />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => downloadPaymentReminder(payment, client?.name || 'Cliente', {
                                                loanId: loan.id,
                                                paymentNumber: idx + 1,
                                                totalPayments: loan.payments.length
                                            })}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500"
                                            title="Descargar recordatorio de calendario"
                                        >
                                            <Calendar size={18} />
                                        </button>

                                        {payment.status !== 'Paid' && (
                                            <button
                                                onClick={() => onRegisterPayment(payment)}
                                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-500 dark:bg-slate-800"
                                                title="Registrar Pago"
                                            >
                                                <DollarSign size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                {expandedPaymentId === payment.id && (
                                    <tr className="bg-slate-50/30">
                                        <td colSpan="5" className="p-4 pl-12 shadow-inner">
                                            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                                                <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    <Clock size={12} />
                                                    Historial de Pagos
                                                </h5>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-slate-500">
                                                            <th className="pb-2 text-left">Fecha Realizada</th>
                                                            <th className="pb-2 text-left">Registrado El (Sistema)</th>
                                                            <th className="pb-2 text-left">Metodo</th>
                                                            <th className="pb-2 text-left">Nota</th>
                                                            <th className="pb-2 text-right">Monto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-slate-600">
                                                        {payment.transactions && payment.transactions.length > 0 ? (
                                                            payment.transactions.map((transaction) => (
                                                                <tr key={transaction.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                                                                    <td className="py-2.5 font-medium">{format(parseISO(transaction.date), 'dd/MM/yyyy')}</td>
                                                                    <td className="py-2.5 text-slate-400">{format(parseISO(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                                                                    <td className="py-2.5 capitalize">{transaction.method}</td>
                                                                    <td className="max-w-[200px] truncate py-2.5 italic text-slate-500" title={transaction.note}>{transaction.note || '-'}</td>
                                                                    <td className="py-2.5 text-right font-bold text-emerald-600">${transaction.amount.toLocaleString()}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="py-4 text-center italic text-slate-400">
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
