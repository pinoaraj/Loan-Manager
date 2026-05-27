import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Calculator as CalcIcon,
    DollarSign,
    Percent,
    Clock,
    Calendar,
    Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateAmortization } from '../utils/amortization';

const Calculator = () => {
    const [formData, setFormData] = useState({
        amount: '5000',
        interestRate: '0.10',
        durationMonths: '5',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'Monthly',
        loanType: 'Fixed'
    });

    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState('');

    const validateFormData = useCallback(() => {
        const amount = parseFloat(formData.amount);
        const interestRate = parseFloat(formData.interestRate);
        const durationMonths = parseInt(formData.durationMonths);

        if (!formData.amount || Number.isNaN(amount)) return 'El monto del prestamo es requerido';
        if (amount <= 0) return 'El monto debe ser mayor a 0';
        if (amount > 1000000000) return 'El monto es demasiado grande';

        if (!formData.interestRate || Number.isNaN(interestRate)) return 'La tasa de interes es requerida';
        if (interestRate < 0) return 'La tasa de interes no puede ser negativa';
        if (interestRate > 1) return 'La tasa de interes parece muy alta (max: 100%)';

        if (!formData.durationMonths || Number.isNaN(durationMonths)) return 'El plazo es requerido';
        if (durationMonths <= 0) return 'El plazo debe ser mayor a 0 meses';
        if (durationMonths > 600) return 'El plazo no puede exceder 50 anos';

        if (!formData.startDate) return 'La fecha de inicio es requerida';

        return '';
    }, [formData]);

    useEffect(() => {
        const calculatePreview = () => {
            const validationError = validateFormData();
            if (validationError) {
                setError(validationError);
                setSchedule([]);
                return;
            }

            setError('');

            try {
                const data = calculateAmortization(
                    parseFloat(formData.amount),
                    parseFloat(formData.interestRate),
                    parseInt(formData.durationMonths),
                    formData.startDate,
                    formData.frequency,
                    formData.loanType
                );

                if (!data || data.length === 0) {
                    setError('No se pudo calcular el plan de amortizacion');
                    setSchedule([]);
                    return;
                }

                setSchedule(data.map((payment) => ({
                    ...payment,
                    dueDate: new Date(payment.dueDate)
                })));
            } catch (previewError) {
                console.error('Preview error:', previewError);
                setError(previewError.message || 'Error al calcular el plan de amortizacion');
                setSchedule([]);
            }
        };

        const timer = setTimeout(calculatePreview, 300);
        return () => clearTimeout(timer);
    }, [formData, validateFormData]);

    const totals = useMemo(() => {
        if (schedule.length === 0) return null;

        const totalAmount = schedule.reduce((acc, curr) => acc + curr.amount, 0);
        const totalInterest = schedule.reduce((acc, curr) => acc + curr.interest, 0);

        return { totalAmount, totalInterest };
    }, [schedule]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 py-1 print:p-0 sm:gap-6">
            <header className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white sm:text-3xl">Simulador de Prestamos</h2>
                    <p className="text-sm text-slate-500 sm:text-base">Calcula cuotas y amortizacion sin registrar datos.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 sm:w-auto"
                >
                    <Printer size={18} />
                    Imprimir Simulacion
                </button>
            </header>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(300px,0.95fr)_minmax(0,1.65fr)]">
                <div className="space-y-5 print:hidden">
                    <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                                    <DollarSign size={16} className="text-blue-500" />
                                    Monto del Prestamo
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-lg font-bold text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-4 sm:text-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                                    <Percent size={16} className="text-blue-500" />
                                    Tasa Interes (Por Periodo)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-4"
                                />
                                <p className="text-xs italic text-slate-400">Ej: 0.10 para 10% mensual</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                                        <Clock size={16} className="text-blue-500" />
                                        Plazo
                                    </label>
                                    <input
                                        type="number"
                                        name="durationMonths"
                                        value={formData.durationMonths}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                                        <Calendar size={16} className="text-blue-500" />
                                        Inicio
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Frecuencia</label>
                                <select
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleChange}
                                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-4"
                                >
                                    <option value="Monthly">Mensual</option>
                                    <option value="Biweekly">Quincenal</option>
                                    <option value="Weekly">Semanal</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Amortizacion</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, loanType: 'Fixed' }))}
                                        className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${formData.loanType === 'Fixed' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        Cuota Fija
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, loanType: 'Simple' }))}
                                        className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${formData.loanType === 'Simple' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        Interes Simple
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">!</div>
                            <div>
                                <h4 className="font-bold text-red-800 dark:text-red-300">Error en la validacion</h4>
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-xl sm:p-6">
                            <div className="absolute right-0 top-0 p-5 opacity-10 transition-transform group-hover:scale-110 sm:p-6">
                                <CalcIcon size={72} />
                            </div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">Cuota Estimada</p>
                            <h3 className="mb-4 break-words text-3xl font-black text-green-400 sm:text-4xl xl:text-5xl">
                                ${schedule[0]?.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <div className="space-y-2 border-t border-slate-800 pt-4 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-400">Total a Pagar</span>
                                    <span className="text-right font-bold">${totals?.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-400">Costo del Interes</span>
                                    <span className="text-right font-bold text-blue-400">${totals?.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center rounded-3xl border border-slate-100 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:p-6">
                            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Informacion del Plan</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">N de Cuotas:</span>
                                    <span className="rounded-lg bg-blue-100 px-3 py-1 font-bold text-blue-700">{schedule.length}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tasa Aplicada:</span>
                                    <span className="text-right font-bold text-slate-900 dark:text-slate-100">{(parseFloat(formData.interestRate) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tipo:</span>
                                    <span className="text-right font-bold text-slate-900 dark:text-slate-100">{formData.loanType === 'Fixed' ? 'Frances (Cuota Fija)' : 'Interes Simple'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                <Calendar size={20} className="text-blue-600" />
                                Tabla de Amortizacion
                            </h4>
                        </div>
                        <div className="custom-scrollbar max-h-[32rem] overflow-x-auto overflow-y-auto">
                            <table className="min-w-[42rem] w-full text-left text-sm">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr>
                                        <th className="p-3 font-bold text-slate-600 sm:p-4">N</th>
                                        <th className="p-3 font-bold text-slate-600 sm:p-4">Fecha</th>
                                        <th className="p-3 text-right font-bold text-slate-600 sm:p-4">Cuota</th>
                                        <th className="p-3 text-right font-bold text-slate-600 sm:p-4">Capital</th>
                                        <th className="p-3 text-right font-bold text-slate-600 sm:p-4">Interes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {schedule.map((payment) => (
                                        <tr key={payment.installment} className="group transition-colors hover:bg-blue-50/50">
                                            <td className="p-3 font-medium text-slate-400 transition-colors group-hover:text-blue-600 sm:p-4">{payment.installment}</td>
                                            <td className="p-3 font-medium text-slate-700 sm:p-4">{format(payment.dueDate, 'dd MMM yyyy')}</td>
                                            <td className="p-3 text-right font-black text-slate-900 sm:p-4">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-slate-500 sm:p-4">${payment.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right font-medium text-blue-600 sm:p-4">${payment.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
