import React, { useState, useMemo } from 'react';
import {
    Calculator as CalcIcon,
    DollarSign,
    Percent,
    Clock,
    Calendar,
    Printer,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateAmortization } from '../utils/amortization';

const Calculator = () => {
    const [formData, setFormData] = useState({
        amount: '5000',
        interestRate: '0.10',
        durationMonths: '5',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'monthly',
        loanType: 'Fixed'
    });

    const schedule = useMemo(() => {
        if (!formData.amount || !formData.durationMonths) return [];
        return calculateAmortization(
            parseFloat(formData.amount) || 0,
            parseFloat(formData.interestRate) || 0,
            parseInt(formData.durationMonths) || 0,
            formData.startDate,
            formData.frequency,
            formData.loanType
        );
    }, [formData]);

    const totals = useMemo(() => {
        if (schedule.length === 0) return null;
        const totalAmount = schedule.reduce((acc, curr) => acc + curr.amount, 0);
        const totalInterest = schedule.reduce((acc, curr) => acc + curr.interest, 0);
        return { totalAmount, totalInterest };
    }, [schedule]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 print:p-0">
            <header className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Simulador de Préstamos</h2>
                    <p className="text-slate-500">Calcula cuotas y amortización sin registrar datos.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold transition-all"
                >
                    <Printer size={20} />
                    Imprimir Simulación
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-700 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    <DollarSign size={16} className="text-blue-500" />
                                    Monto del Préstamo
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xl font-bold text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    <Percent size={16} className="text-blue-500" />
                                    Tasa Interés (Por Periodo)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-slate-400 italic">Ej: 0.10 para 10% mensual</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        <Clock size={16} className="text-blue-500" />
                                        Plazo
                                    </label>
                                    <input
                                        type="number"
                                        name="durationMonths"
                                        value={formData.durationMonths}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        <Calendar size={16} className="text-blue-500" />
                                        Inicio
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Frecuencia</label>
                                <select
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    <option value="monthly">Mensual</option>
                                    <option value="bi-weekly">Quincenal</option>
                                    <option value="weekly">Semanal</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Amortización</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, loanType: 'Fixed' }))}
                                        className={`p-3 rounded-xl border-2 font-bold transition-all text-sm ${formData.loanType === 'Fixed' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                                    >
                                        Cuota Fija
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, loanType: 'Simple' }))}
                                        className={`p-3 rounded-xl border-2 font-bold transition-all text-sm ${formData.loanType === 'Simple' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                                    >
                                        Interés Simple
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results and Schedule */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <CalcIcon size={80} />
                            </div>
                            <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-2">Cuota Estimada</p>
                            <h3 className="text-5xl font-black text-green-400 mb-6">
                                ${schedule[0]?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <div className="space-y-2 pt-4 border-t border-slate-800">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Total a Pagar</span>
                                    <span className="font-bold">${totals?.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Costo del Interés</span>
                                    <span className="font-bold text-blue-400">${totals?.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                            <h4 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4">Información del Plan</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Nº de Cuotas:</span>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold">{schedule.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Tasa Aplicada:</span>
                                    <span className="text-slate-800 dark:text-white font-bold">{(parseFloat(formData.interestRate) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Tipo:</span>
                                    <span className="text-slate-800 dark:text-white font-bold">{formData.loanType === 'Fixed' ? 'Francés (Cuota Fija)' : 'Interés Simple'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="bg-white border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Calendar size={20} className="text-blue-600" />
                                Tabla de Amortización
                            </h4>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-600">Nº</th>
                                        <th className="p-4 font-bold text-slate-600">Fecha</th>
                                        <th className="p-4 font-bold text-slate-600 text-right">Cuota</th>
                                        <th className="p-4 font-bold text-slate-600 text-right">Capital</th>
                                        <th className="p-4 font-bold text-slate-600 text-right">Interés</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {schedule.map((p) => (
                                        <tr key={p.installment} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="p-4 font-medium text-slate-400 group-hover:text-blue-600 transition-colors">{p.installment}</td>
                                            <td className="p-4 text-slate-700 font-medium">{format(p.dueDate, 'dd MMM yyyy')}</td>
                                            <td className="p-4 text-right font-black text-slate-900">${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-4 text-right text-slate-500">${p.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-4 text-right text-blue-600 font-medium">${p.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
