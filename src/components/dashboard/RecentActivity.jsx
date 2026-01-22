import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

const RecentActivity = ({ transactions }) => {
    const navigate = useNavigate();

    // transactions might have structure: id, clientName, amount, date, method
    // BUT to navigate to loan, we need loanId. 
    // The previous backend change for /api/dashboard/recent might NOT have included loanId exposed in the logical object map.
    // Let's check logic:
    /*
        const recent = transactions.map(t => ({
            id: t.id,
            clientName: t.payment.loan.client.name,
            amount: t.amount,
            date: t.date,
            method: t.method
            // Missing loanId? t.payment.loan.id is available in query include.
        }));
    */
    // I need to update Backend first if loanId is missing, OR check if it was included.
    // Wait, looking at Step 737 replacement content: 
    /*
        const recent = transactions.map(t => ({
             id: t.id,
             clientName: t.payment.loan.client.name,
             amount: t.amount,
             date: t.date,
             method: t.method
         }));
    */
    // loanId IS MISSING. I need to fix backend to include `loanId: t.payment.loan.id`.

    return (
        <div className="glass-panel p-5 rounded-3xl h-full flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">Actividad</h3>
                <button onClick={() => navigate('/collections')} className="text-xs text-teal-600 font-bold hover:text-teal-700 hover:underline">VER TODO</button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar pb-2">
                {transactions.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay transacciones recientes.</p>
                ) : (
                    transactions.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => t.loanId ? navigate(`/loans/${t.loanId}`) : null}
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${t.loanId ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}`}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px] shrink-0">
                                    {t.clientName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-slate-800 dark:text-white text-xs truncate leading-tight">{t.clientName}</h4>
                                    <p className="text-slate-500 text-[10px] truncate leading-tight">
                                        {format(parseISO(t.date), 'dd MMM, HH:mm')} • {t.method || 'Efectivo'}
                                    </p>
                                </div>
                            </div>
                            <span className="font-bold text-emerald-600 text-xs whitespace-nowrap ml-2 shrink-0">
                                +${t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
