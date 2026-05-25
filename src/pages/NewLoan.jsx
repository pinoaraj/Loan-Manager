import React, { useState, useMemo, useEffect } from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Calculator,
    Save,
    User,
    ArrowRight,
    ArrowLeft,
    Calendar,
    DollarSign,
    Percent,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { downloadLoanCalendar } from '../utils/calendar';

const isValidEmail = (value) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value);

const NewLoan = () => {
    const navigate = useNavigate();
    const { clients, addLoan, addClient, getLoanPreview } = useLoans();

    const [step, setStep] = useState(1);
    const [isAddingClient, setIsAddingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', address: '' });
    const [newClientErrors, setNewClientErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        clientId: '',
        amount: '',
        interestRate: 0.10,
        durationMonths: 12,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'Monthly',
        loanType: 'Fixed',
        graceDays: 3,
        lateFeeType: 'Fixed',
        lateFeeValue: 0,
    });

    const [schedule, setSchedule] = useState([]);
    const filteredClients = useMemo(() => {
        return (clients || []).filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone && c.phone.includes(searchTerm))
        );
    }, [clients, searchTerm]);

    const selectedClient = useMemo(() => {
        return (clients || []).find(c => c.id === formData.clientId);
    }, [clients, formData.clientId]);

    useEffect(() => {
        const fetchPreview = async () => {
            const amount = parseFloat(formData.amount);
            const duration = parseInt(formData.durationMonths);
            const rate = parseFloat(formData.interestRate);

            if (isNaN(amount) || isNaN(duration) || amount <= 0) {
                setSchedule([]);
                return;
            }

            try {
                const data = await getLoanPreview({
                    amount: amount,
                    interestRate: isNaN(rate) ? 0 : rate,
                    durationMonths: duration,
                    startDate: formData.startDate,
                    frequency: formData.frequency,
                    loanType: formData.loanType
                });
                // Ensure dates are parsed back into Date objects for the table
                const parsedData = (data || []).map(p => ({
                    ...p,
                    dueDate: new Date(p.dueDate)
                }));
                setSchedule(parsedData);
            } catch (error) {
                console.error('Preview error:', error);
            }
        };

        const timer = setTimeout(fetchPreview, 500); // Debounce
        return () => clearTimeout(timer);
    }, [formData, getLoanPreview]);

    const totals = useMemo(() => {
        if (schedule.length === 0) return { totalAmount: 0, totalInterest: 0 };
        const totalAmount = schedule.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const totalInterest = schedule.reduce((acc, curr) => acc + (Number(curr.interest) || 0), 0);
        return { totalAmount, totalInterest };
    }, [schedule]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuickAddClient = async (e) => {
        e.preventDefault();
        const normalizedClient = {
            name: newClientData.name.trim(),
            email: newClientData.email.trim(),
            phone: newClientData.phone.trim(),
            address: newClientData.address.trim()
        };
        const nextErrors = {};
        if (!normalizedClient.name) nextErrors.name = 'El nombre es obligatorio.';
        if (normalizedClient.email && !isValidEmail(normalizedClient.email)) {
            nextErrors.email = 'Ingresa un email valido, por ejemplo nombre@correo.com.';
        }

        setNewClientErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        try {
            const result = await addClient(normalizedClient);
            if (result.success && result.data) {
                setFormData(prev => ({ ...prev, clientId: result.data.id }));
                setIsAddingClient(false);
                setNewClientData({ name: '', email: '', phone: '', address: '' });
                setNewClientErrors({});
            }
        } catch (error) {
            alert('Error al crear cliente: ' + error.message);
        }
    };

    const validateStep = (currentStep) => {
        const newErrors = {};
        if (currentStep === 1) {
            if (!formData.clientId) newErrors.clientId = 'Debes seleccionar un cliente para continuar.';
        } else if (currentStep === 2) {
            if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'El monto debe ser mayor a 0.';
            if (!formData.durationMonths || parseInt(formData.durationMonths) <= 0) newErrors.durationMonths = 'La duración debe ser mayor a 0.';
            if (formData.interestRate < 0) newErrors.interestRate = 'La tasa de interés no puede ser negativa.';
            if (parseInt(formData.graceDays) < 0) newErrors.graceDays = 'Días de gracia no puede ser negativo.';
            if (parseFloat(formData.lateFeeValue) < 0) newErrors.lateFeeValue = 'El valor de la mora no puede ser negativo.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!validateStep(3)) return;

            const result = await addLoan({
                ...formData,
                amount: parseFloat(formData.amount),
                interestRate: parseFloat(formData.interestRate),
                durationMonths: parseInt(formData.durationMonths),
                graceDays: parseInt(formData.graceDays),
                lateFeeType: formData.lateFeeType,
                lateFeeValue: parseFloat(formData.lateFeeValue)
            });

            if (result?.data?.loan && result?.data?.payments) {
                downloadLoanCalendar(
                    { ...result.data.loan, payments: result.data.payments },
                    selectedClient
                );
                toast.success('Prestamo creado y calendario descargado.');
            }

            navigate('/loans');
        } catch (error) {
            console.error('Failed to create loan:', error);
            alert('Error al crear el préstamo: ' + error.message);
        }
    };

    const steps = [
        { id: 1, name: 'Seleccionar Cliente', icon: User },
        { id: 2, name: 'Configurar Préstamo', icon: Calculator },
        { id: 3, name: 'Revisión y Plan', icon: CheckCircle2 }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Constructor de Préstamo</h2>
                    <p className="text-slate-500">Sigue los pasos para crear un nuevo crédito.</p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    {steps.map((s, idx) => (
                        <div key={s.id} className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-all ${step === s.id ? 'bg-blue-600 text-white' :
                                step > s.id ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {step > s.id ? <CheckCircle2 size={20} /> : s.id}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-8 h-1 mx-2 rounded ${step > s.id ? 'bg-green-200' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
                {/* Step 1: Client Selection */}
                {step === 1 && (
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center gap-2">
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                    Buscar Cliente
                                    {errors.clientId && <span className="text-rose-500 ml-2 normal-case font-bold">{errors.clientId}</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre o teléfono..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setIsAddingClient(true)}
                                className="mt-7 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2"
                            >
                                <User size={20} />
                                Nuevo Cliente
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredClients.length === 0 ? (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
                                    <p className="text-slate-400 font-medium">No se encontraron resultados para "{searchTerm}"</p>
                                    <button
                                        onClick={() => setIsAddingClient(true)}
                                        className="mt-4 text-blue-600 font-bold hover:underline"
                                    >
                                        Crear nuevo cliente "{searchTerm}"
                                    </button>
                                </div>
                            ) : (
                                filteredClients.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setFormData(prev => ({ ...prev, clientId: c.id }))}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${formData.clientId === c.id
                                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600'
                                            : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.clientId === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{c.name}</p>
                                            <p className="text-sm text-slate-500">{c.phone || c.email || 'Sin contacto'}</p>
                                        </div>
                                        {formData.clientId === c.id && (
                                            <div className="ml-auto text-blue-600">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {isAddingClient && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Rápido: Nuevo Cliente</h3>
                                    </div>
                                    <form noValidate onSubmit={handleQuickAddClient} className="p-8 space-y-4">
                                        <div className="space-y-1">
                                            <input
                                                required
                                                placeholder="Nombre Completo"
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                                                value={newClientData.name}
                                                onChange={(e) => {
                                                    setNewClientData({ ...newClientData, name: e.target.value });
                                                    setNewClientErrors(prev => ({ ...prev, name: '' }));
                                                }}
                                            />
                                            {newClientErrors.name && <p className="text-xs font-bold text-rose-500">{newClientErrors.name}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <input
                                                type="email"
                                                placeholder="Email (opcional)"
                                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                                                value={newClientData.email}
                                                onChange={(e) => {
                                                    setNewClientData({ ...newClientData, email: e.target.value });
                                                    setNewClientErrors(prev => ({ ...prev, email: '' }));
                                                }}
                                            />
                                            {newClientErrors.email && <p className="text-xs font-bold text-rose-500">{newClientErrors.email}</p>}
                                        </div>
                                        <input
                                            placeholder="Teléfono (opcional)"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                                            value={newClientData.phone}
                                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                        />
                                        <input
                                            placeholder="Dirección (opcional)"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl outline-none"
                                            value={newClientData.address}
                                            onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                        />
                                        <div className="flex gap-3 pt-4">
                                            <button type="button" onClick={() => setIsAddingClient(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancelar</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Crear y Seleccionar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-50">
                            <button
                                disabled={!formData.clientId}
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-blue-200"
                            >
                                Siguiente
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Loan Config */}
                {step === 2 && (
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-2xl">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">Cliente Seleccionado</p>
                                <p className="font-bold text-slate-800 dark:text-white">{selectedClient?.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <DollarSign size={16} className="text-blue-500" />
                                    Monto del Préstamo ($)
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="Ej: 5000"
                                    className={`w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border rounded-2xl focus:ring-2 outline-none transition-all text-xl font-bold text-slate-800 dark:text-white ${errors.amount ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'}`}
                                />
                                {errors.amount && <span className="text-xs text-rose-500 font-bold ml-1">{errors.amount}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Calendar size={16} className="text-blue-500" />
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Percent size={16} className="text-blue-500" />
                                    Tasa Interés (Por Periodo, Ej: 0.10 = 10%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    className={`w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border rounded-2xl focus:ring-2 outline-none transition-all ${errors.interestRate ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'}`}
                                />
                                {errors.interestRate && <span className="text-xs text-rose-500 font-bold ml-1">{errors.interestRate}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Clock size={16} className="text-blue-500" />
                                    Duración (Meses)
                                </label>
                                <input
                                    type="number"
                                    name="durationMonths"
                                    value={formData.durationMonths}
                                    onChange={handleChange}
                                    className={`w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border rounded-2xl focus:ring-2 outline-none transition-all ${errors.durationMonths ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'}`}
                                />
                                {errors.durationMonths && <span className="text-xs text-rose-500 font-bold ml-1">{errors.durationMonths}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Frecuencia de Pagos</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'Monthly', label: 'Mensual' },
                                        { value: 'Biweekly', label: 'Quincenal' },
                                        { value: 'Weekly', label: 'Semanal' }
                                    ].map(freq => (
                                        <button
                                            key={freq.value}
                                            onClick={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                                            className={`p-3 rounded-xl border-2 font-medium transition-all ${formData.frequency === freq.value
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 dark:border-slate-700 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            {freq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Tipo de Amortización</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Fixed', 'Simple'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData(prev => ({ ...prev, loanType: type }))}
                                            className={`p-3 rounded-xl border-2 font-medium transition-all ${formData.loanType === type
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 dark:border-slate-700 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            {type === 'Fixed' ? 'Cuota Fija' : 'Interés Simple'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-500" />
                                    Configuración de Mora (Late Fees)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Días de Gracia</label>
                                        <input
                                            type="number"
                                            name="graceDays"
                                            value={formData.graceDays}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 dark:text-white"
                                        />
                                        {errors.graceDays && <span className="text-xs text-rose-500 font-bold ml-1">{errors.graceDays}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Tipo de Mora</label>
                                        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                                            {['Fixed', 'Percent'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, lateFeeType: type }))}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.lateFeeType === type
                                                        ? 'bg-white shadow-sm text-slate-800'
                                                        : 'text-slate-400 hover:text-slate-600'
                                                        }`}
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
                                            placeholder={formData.lateFeeType === 'Percent' ? 'Ej: 0.05' : 'Ej: 10'}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 dark:text-white"
                                        />
                                        {errors.lateFeeValue && <span className="text-xs text-rose-500 font-bold ml-1">{errors.lateFeeValue}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-50">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-slate-500 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all underline underline-offset-4"
                            >
                                <ArrowLeft size={20} />
                                Atrás
                            </button>
                            <button
                                disabled={!formData.amount || !formData.durationMonths}
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-blue-200"
                            >
                                Revisar Plan
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                                    <h4 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-4">Resumen</h4>
                                    <div className="space-y-4">
                                        <div className="pb-4 border-b border-slate-800">
                                            <p className="text-slate-400 text-sm">Cuota Estimada</p>
                                            <p className="text-3xl font-extrabold text-green-400">
                                                ${schedule[0] ? Number(schedule[0].amount).toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">Capital</span>
                                                <span className="font-bold">${(Number(formData.amount) || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">Interés Total</span>
                                                <span className="font-bold">${totals?.totalInterest.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 text-lg font-bold">
                                                <span>Total</span>
                                                <span className="text-blue-400">${totals?.totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">Detalles</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Frecuencia:</span>
                                            <span className="font-bold capitalize">{formData.frequency}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Tipo:</span>
                                            <span className="font-bold">{formData.loanType === 'Fixed' ? 'Francés (Fija)' : 'Simple'}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Plazo:</span>
                                            <span className="font-bold">{formData.durationMonths} meses ({schedule.length} cuotas)</span>
                                        </li>
                                        <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2"></div>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Días de Gracia:</span>
                                            <span className="font-bold">{formData.graceDays} días</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-500">Mora ({formData.lateFeeType === 'Fixed' ? 'Fija' : '%'}):</span>
                                            <span className="font-bold text-amber-600">
                                                {formData.lateFeeType === 'Fixed' ? '$' : ''}{formData.lateFeeValue}{formData.lateFeeType === 'Percent' ? '%' : ''}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <h4 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                                    <Calendar size={20} className="text-blue-600" />
                                    Cronograma de Pagos
                                </h4>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden max-h-[500px] overflow-y-auto shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="p-4 font-bold text-slate-600">#</th>
                                                <th className="p-4 font-bold text-slate-600">Fecha</th>
                                                <th className="p-4 font-bold text-slate-600 text-right">Cuota</th>
                                                <th className="p-4 font-bold text-slate-600 text-right">Capital</th>
                                                <th className="p-4 font-bold text-slate-600 text-right">Interés</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {schedule.map((p) => (
                                                <tr key={p.installment} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-400">{p.installment}</td>
                                                    <td className="p-4 text-slate-700">{format(p.dueDate, 'dd MMM yyyy')}</td>
                                                    <td className="p-4 text-right font-bold text-slate-800 dark:text-white">${Number(p.amount).toFixed(2)}</td>
                                                    <td className="p-4 text-right text-slate-600">${Number(p.principal).toFixed(2)}</td>
                                                    <td className="p-4 text-right text-slate-600">${Number(p.interest).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-50">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-slate-500 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all underline underline-offset-4"
                            >
                                <ArrowLeft size={20} />
                                Atrás
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                            >
                                <Save size={20} />
                                Confirmar y Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewLoan;
