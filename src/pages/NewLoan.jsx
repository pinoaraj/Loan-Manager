import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Percent,
    Save,
    User
} from 'lucide-react';
import { useLoans } from '../context/useLoans';
import { downloadLoanCalendar } from '../utils/calendar';
import { formatRutInput, isValidRut } from '../utils/rut';

const isValidEmail = (value) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value);

const NewLoan = () => {
    const navigate = useNavigate();
    const { clients, addLoan, addClient, getLoanPreview } = useLoans();

    const [step, setStep] = useState(1);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [newClientErrors, setNewClientErrors] = useState({});
    const [newClientData, setNewClientData] = useState({
        name: '',
        rut: '',
        email: '',
        phone: '',
        address: ''
    });
    const [formData, setFormData] = useState({
        clientId: '',
        amount: '',
        interestRate: 0.1,
        durationMonths: 12,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'Monthly',
        loanType: 'Fixed',
        graceDays: 3,
        lateFeeType: 'Fixed',
        lateFeeValue: 0
    });
    const [schedule, setSchedule] = useState([]);

    const filteredClients = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return clients || [];

        return (clients || []).filter((client) =>
            client.name?.toLowerCase().includes(query) ||
            client.phone?.includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.rut?.toLowerCase().includes(query)
        );
    }, [clients, searchTerm]);

    const selectedClient = useMemo(
        () => (clients || []).find((client) => client.id === formData.clientId),
        [clients, formData.clientId]
    );

    useEffect(() => {
        const fetchPreview = async () => {
            const amount = parseFloat(formData.amount);
            const duration = parseInt(formData.durationMonths, 10);
            const rate = parseFloat(formData.interestRate);

            if (Number.isNaN(amount) || Number.isNaN(duration) || amount <= 0) {
                setSchedule([]);
                return;
            }

            try {
                const preview = await getLoanPreview({
                    amount,
                    interestRate: Number.isNaN(rate) ? 0 : rate,
                    durationMonths: duration,
                    startDate: formData.startDate,
                    frequency: formData.frequency,
                    loanType: formData.loanType
                });

                setSchedule((preview || []).map((payment) => ({
                    ...payment,
                    dueDate: new Date(payment.dueDate)
                })));
            } catch (error) {
                console.error('Preview error:', error);
            }
        };

        const timer = setTimeout(fetchPreview, 400);
        return () => clearTimeout(timer);
    }, [formData, getLoanPreview]);

    const totals = useMemo(() => {
        if (schedule.length === 0) {
            return { totalAmount: 0, totalInterest: 0 };
        }

        return schedule.reduce((accumulator, current) => ({
            totalAmount: accumulator.totalAmount + (Number(current.amount) || 0),
            totalInterest: accumulator.totalInterest + (Number(current.interest) || 0)
        }), { totalAmount: 0, totalInterest: 0 });
    }, [schedule]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const validateQuickClient = () => {
        const normalizedClient = {
            name: newClientData.name.trim(),
            rut: formatRutInput(newClientData.rut),
            email: newClientData.email.trim(),
            phone: newClientData.phone.trim(),
            address: newClientData.address.trim()
        };

        const nextErrors = {};
        if (!normalizedClient.name) nextErrors.name = 'El nombre es obligatorio.';
        if (!normalizedClient.rut) nextErrors.rut = 'El RUT es obligatorio.';
        if (normalizedClient.rut && !isValidRut(normalizedClient.rut)) nextErrors.rut = 'Ingresa un RUT valido.';
        if (!normalizedClient.phone) nextErrors.phone = 'El telefono es obligatorio.';
        if (!normalizedClient.address) nextErrors.address = 'La direccion es obligatoria.';
        if (normalizedClient.email && !isValidEmail(normalizedClient.email)) {
            nextErrors.email = 'Ingresa un email valido, por ejemplo nombre@correo.com.';
        }

        setNewClientErrors(nextErrors);
        return { normalizedClient, isValid: Object.keys(nextErrors).length === 0 };
    };

    const handleQuickAddClient = async (event) => {
        event.preventDefault();
        const { normalizedClient, isValid } = validateQuickClient();

        if (!isValid) {
            return;
        }

        try {
            const result = await addClient(normalizedClient);
            if (result.success && result.data) {
                setFormData((previous) => ({ ...previous, clientId: result.data.id }));
                setIsAddingClient(false);
                setNewClientData({ name: '', rut: '', email: '', phone: '', address: '' });
                setNewClientErrors({});
            }
        } catch (error) {
            alert(`Error al crear cliente: ${error.message}`);
        }
    };

    const validateStep = (currentStep) => {
        const nextErrors = {};

        if (currentStep === 1 && !formData.clientId) {
            nextErrors.clientId = 'Debes seleccionar un cliente para continuar.';
        }

        if (currentStep === 2) {
            if (!formData.amount || parseFloat(formData.amount) <= 0) nextErrors.amount = 'El monto debe ser mayor a 0.';
            if (!formData.durationMonths || parseInt(formData.durationMonths, 10) <= 0) nextErrors.durationMonths = 'La duracion debe ser mayor a 0.';
            if (Number(formData.interestRate) < 0) nextErrors.interestRate = 'La tasa de interes no puede ser negativa.';
            if (parseInt(formData.graceDays, 10) < 0) nextErrors.graceDays = 'Los dias de gracia no pueden ser negativos.';
            if (parseFloat(formData.lateFeeValue) < 0) nextErrors.lateFeeValue = 'El valor de la mora no puede ser negativo.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((previous) => previous + 1);
        }
    };

    const handleBack = () => setStep((previous) => previous - 1);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateStep(2)) {
            return;
        }

        try {
            const result = await addLoan({
                ...formData,
                amount: parseFloat(formData.amount),
                interestRate: parseFloat(formData.interestRate),
                durationMonths: parseInt(formData.durationMonths, 10),
                graceDays: parseInt(formData.graceDays, 10),
                lateFeeValue: parseFloat(formData.lateFeeValue)
            });

            if (result?.data?.loan && result?.data?.payments) {
                downloadLoanCalendar({ ...result.data.loan, payments: result.data.payments }, selectedClient);
                toast.success('Prestamo creado y calendario descargado.');
            }

            navigate('/loans');
        } catch (error) {
            console.error('Failed to create loan:', error);
            alert(`Error al crear el prestamo: ${error.message}`);
        }
    };

    const steps = [
        { id: 1, name: 'Seleccionar Cliente', icon: User },
        { id: 2, name: 'Configurar Prestamo', icon: Calendar },
        { id: 3, name: 'Revision', icon: CheckCircle2 }
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-8 p-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Constructor de Prestamo</h2>
                    <p className="text-slate-500">Sigue los pasos para crear un nuevo credito.</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    {steps.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${step === item.id ? 'bg-blue-600 text-white' : step > item.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {step > item.id ? <CheckCircle2 size={18} /> : item.id}
                            </div>
                            <span className="hidden text-sm font-semibold text-slate-500 md:block">{item.name}</span>
                        </div>
                    ))}
                </div>
            </header>

            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800">
                {step === 1 && (
                    <div className="space-y-6 p-8">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                                    Buscar Cliente
                                    {errors.clientId && <span className="ml-2 font-bold normal-case text-rose-500">{errors.clientId}</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre, telefono o RUT..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={() => setIsAddingClient(true)}
                                className="rounded-2xl bg-slate-100 px-6 py-4 font-bold text-slate-600 transition-all hover:bg-blue-600 hover:text-white"
                            >
                                Nuevo Cliente
                            </button>
                        </div>

                        <div className="grid max-h-[420px] grid-cols-1 gap-4 overflow-y-auto pr-2 md:grid-cols-2">
                            {filteredClients.length === 0 ? (
                                <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-100 py-12 text-center dark:border-slate-700">
                                    <p className="font-medium text-slate-400">No se encontraron resultados para "{searchTerm}"</p>
                                    <button onClick={() => setIsAddingClient(true)} className="mt-4 font-bold text-blue-600 hover:underline">
                                        Crear nuevo cliente
                                    </button>
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <button
                                        key={client.id}
                                        onClick={() => setFormData((previous) => ({ ...previous, clientId: client.id }))}
                                        className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${formData.clientId === client.id ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800'}`}
                                    >
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${formData.clientId === client.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <User size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-slate-800 dark:text-white">{client.name}</p>
                                            <p className="truncate text-sm text-slate-500">{client.rut || client.phone || client.email || 'Sin contacto'}</p>
                                        </div>
                                        {formData.clientId === client.id && (
                                            <div className="ml-auto text-blue-600">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-50 pt-4">
                            <button
                                disabled={!formData.clientId}
                                onClick={handleNext}
                                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-50"
                            >
                                Siguiente
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 p-8">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
                            <p className="text-xs font-bold uppercase tracking-tight text-blue-600">Cliente Seleccionado</p>
                            <p className="font-bold text-slate-800 dark:text-white">{selectedClient?.name}</p>
                            {selectedClient?.rut && <p className="text-sm text-slate-500">{selectedClient.rut}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Monto</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className={`w-full rounded-2xl border p-4 outline-none transition-all ${errors.amount ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-500 dark:border-slate-600'}`}
                                />
                                {errors.amount && <span className="ml-1 text-xs font-bold text-rose-500">{errors.amount}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Percent size={16} className="text-blue-500" />
                                    Tasa de Interes
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    className={`w-full rounded-2xl border p-4 outline-none transition-all ${errors.interestRate ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-500 dark:border-slate-600'}`}
                                />
                                {errors.interestRate && <span className="ml-1 text-xs font-bold text-rose-500">{errors.interestRate}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Clock size={16} className="text-blue-500" />
                                    Duracion (Meses)
                                </label>
                                <input
                                    type="number"
                                    name="durationMonths"
                                    value={formData.durationMonths}
                                    onChange={handleChange}
                                    className={`w-full rounded-2xl border p-4 outline-none transition-all ${errors.durationMonths ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-500 dark:border-slate-600'}`}
                                />
                                {errors.durationMonths && <span className="ml-1 text-xs font-bold text-rose-500">{errors.durationMonths}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Fecha de Inicio</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Frecuencia de Pagos</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'Monthly', label: 'Mensual' },
                                        { value: 'Biweekly', label: 'Quincenal' },
                                        { value: 'Weekly', label: 'Semanal' }
                                    ].map((frequency) => (
                                        <button
                                            key={frequency.value}
                                            type="button"
                                            onClick={() => setFormData((previous) => ({ ...previous, frequency: frequency.value }))}
                                            className={`rounded-xl border-2 p-3 font-medium transition-all ${formData.frequency === frequency.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                        >
                                            {frequency.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Tipo de Amortizacion</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Fixed', 'Simple'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData((previous) => ({ ...previous, loanType: type }))}
                                            className={`rounded-xl border-2 p-3 font-medium transition-all ${formData.loanType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                                        >
                                            {type === 'Fixed' ? 'Cuota Fija' : 'Interes Simple'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 pt-4 dark:border-slate-700">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                                <AlertCircle size={16} className="text-amber-500" />
                                Configuracion de Mora
                            </h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Dias de Gracia</label>
                                    <input
                                        type="number"
                                        name="graceDays"
                                        value={formData.graceDays}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition-all focus:ring-2 focus:ring-amber-500 dark:border-slate-600"
                                    />
                                    {errors.graceDays && <span className="ml-1 text-xs font-bold text-rose-500">{errors.graceDays}</span>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Tipo de Mora</label>
                                    <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                                        {['Fixed', 'Percent'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData((previous) => ({ ...previous, lateFeeType: type }))}
                                                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${formData.lateFeeType === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {type === 'Fixed' ? 'Monto Fijo ($)' : 'Porcentaje (%)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Valor de Mora</label>
                                    <input
                                        type="number"
                                        name="lateFeeValue"
                                        step={formData.lateFeeType === 'Percent' ? '0.01' : '1'}
                                        value={formData.lateFeeValue}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl border border-slate-200 p-4 outline-none transition-all focus:ring-2 focus:ring-amber-500 dark:border-slate-600"
                                    />
                                    {errors.lateFeeValue && <span className="ml-1 text-xs font-bold text-rose-500">{errors.lateFeeValue}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between border-t border-slate-50 pt-4">
                            <button onClick={handleBack} className="flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-slate-500 transition-all hover:bg-slate-50">
                                <ArrowLeft size={20} />
                                Atras
                            </button>
                            <button onClick={handleNext} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700">
                                Revisar Plan
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 p-8">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-1">
                                <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Resumen</h4>
                                    <div className="space-y-3">
                                        <div className="border-b border-slate-800 pb-4">
                                            <p className="text-sm text-slate-400">Cuota Estimada</p>
                                            <p className="text-3xl font-extrabold text-green-400">
                                                ${schedule[0] ? Number(schedule[0].amount).toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Capital</span>
                                            <span className="font-bold">${(Number(formData.amount) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Interes Total</span>
                                            <span className="font-bold">${totals.totalInterest.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-blue-400">${totals.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-700">
                                    <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Detalles</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Cliente</span>
                                            <span className="font-bold">{selectedClient?.name}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Frecuencia</span>
                                            <span className="font-bold">{formData.frequency}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Tipo</span>
                                            <span className="font-bold">{formData.loanType}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Plazo</span>
                                            <span className="font-bold">{formData.durationMonths} meses</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-4 lg:col-span-2">
                                <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                    <Calendar size={20} className="text-blue-600" />
                                    Cronograma de Pagos
                                </h4>
                                <div className="max-h-[500px] overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-slate-50">
                                            <tr>
                                                <th className="p-4 font-bold text-slate-600">#</th>
                                                <th className="p-4 font-bold text-slate-600">Fecha</th>
                                                <th className="p-4 text-right font-bold text-slate-600">Cuota</th>
                                                <th className="p-4 text-right font-bold text-slate-600">Capital</th>
                                                <th className="p-4 text-right font-bold text-slate-600">Interes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {schedule.map((payment) => (
                                                <tr key={payment.installment} className="transition-colors hover:bg-blue-50/50">
                                                    <td className="p-4 font-medium text-slate-400">{payment.installment}</td>
                                                    <td className="p-4 text-slate-700">{format(payment.dueDate, 'dd MMM yyyy')}</td>
                                                    <td className="p-4 text-right font-bold text-slate-800 dark:text-white">${Number(payment.amount).toFixed(2)}</td>
                                                    <td className="p-4 text-right text-slate-600">${Number(payment.principal).toFixed(2)}</td>
                                                    <td className="p-4 text-right text-slate-600">${Number(payment.interest).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between border-t border-slate-50 pt-4">
                            <button onClick={handleBack} className="flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-slate-500 transition-all hover:bg-slate-50">
                                <ArrowLeft size={20} />
                                Atras
                            </button>
                            <button onClick={handleSubmit} className="flex items-center gap-2 rounded-2xl bg-green-600 px-10 py-4 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700">
                                <Save size={20} />
                                Confirmar y Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isAddingClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-slate-800">
                        <div className="border-b border-slate-100 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Rapido: Nuevo Cliente</h3>
                        </div>
                        <form noValidate onSubmit={handleQuickAddClient} className="space-y-4 p-8">
                            <div className="space-y-1">
                                <input
                                    required
                                    placeholder="Nombre Completo"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    value={newClientData.name}
                                    onChange={(event) => {
                                        setNewClientData({ ...newClientData, name: event.target.value });
                                        setNewClientErrors((previous) => ({ ...previous, name: '' }));
                                    }}
                                />
                                {newClientErrors.name && <p className="text-xs font-bold text-rose-500">{newClientErrors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <input
                                    required
                                    placeholder="RUT"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    value={newClientData.rut}
                                    onChange={(event) => {
                                        setNewClientData({ ...newClientData, rut: formatRutInput(event.target.value) });
                                        setNewClientErrors((previous) => ({ ...previous, rut: '' }));
                                    }}
                                />
                                {newClientErrors.rut && <p className="text-xs font-bold text-rose-500">{newClientErrors.rut}</p>}
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="email"
                                    placeholder="Email (opcional)"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    value={newClientData.email}
                                    onChange={(event) => {
                                        setNewClientData({ ...newClientData, email: event.target.value });
                                        setNewClientErrors((previous) => ({ ...previous, email: '' }));
                                    }}
                                />
                                {newClientErrors.email && <p className="text-xs font-bold text-rose-500">{newClientErrors.email}</p>}
                            </div>
                            <input
                                    placeholder="Telefono"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={newClientData.phone}
                                onChange={(event) => setNewClientData({ ...newClientData, phone: event.target.value })}
                            />
                            <input
                                placeholder="Direccion"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                value={newClientData.address}
                                onChange={(event) => setNewClientData({ ...newClientData, address: event.target.value })}
                            />
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsAddingClient(false)} className="flex-1 py-3 font-bold text-slate-400">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white">
                                    Crear y Seleccionar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewLoan;
