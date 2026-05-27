import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Landmark, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatRutInput, isValidRut } from '../utils/rut';

const getPreferredLoanId = (loans = [], fallbackLoan) => {
    if (fallbackLoan?.id) {
        return fallbackLoan.id;
    }

    const activeLoan = loans.find((item) => item.status === 'Active');
    if (activeLoan?.id) {
        return activeLoan.id;
    }

    const sortedLoans = [...loans].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    return sortedLoans[0]?.id || '';
};

const PagareModal = ({ isOpen, onClose, loan, loans = [], client }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        rut: '',
        address: ''
    });
    const [selectedLoanId, setSelectedLoanId] = useState('');

    const availableLoans = useMemo(() => {
        if (loans.length > 0) {
            return loans;
        }
        return loan ? [loan] : [];
    }, [loan, loans]);

    const selectedLoan = useMemo(
        () => availableLoans.find((item) => item.id === selectedLoanId) || availableLoans[0] || loan,
        [availableLoans, loan, selectedLoanId]
    );

    useEffect(() => {
        if (!client || !isOpen) {
            return;
        }

        setFormData({
            clientName: client.name || '',
            rut: formatRutInput(client.rut || ''),
            address: client.address || ''
        });
        setSelectedLoanId(getPreferredLoanId(availableLoans, loan));
    }, [availableLoans, client, isOpen, loan]);

    if (!isOpen) {
        return null;
    }

    const hasRequiredData = selectedLoan && formData.clientName.trim() && formData.address.trim() && isValidRut(formData.rut);

    const getDocumentPayload = () => ({
        ...client,
        name: formData.clientName.trim(),
        rut: formatRutInput(formData.rut),
        address: formData.address.trim()
    });

    const handleGeneratePagare = async () => {
        try {
            const { generatePagare } = await import('../utils/pagareGenerator');
            await generatePagare(selectedLoan, getDocumentPayload());
            toast.success('Pagare generado correctamente.');
        } catch (error) {
            console.error(error);
            toast.error('Error generando el pagare.');
        }
    };

    const handleGenerateMutuo = async () => {
        try {
            const { generateMutuoDocument } = await import('../utils/pagareGenerator');
            await generateMutuoDocument(selectedLoan, getDocumentPayload());
            toast.success('Mutuo generado correctamente.');
        } catch (error) {
            console.error(error);
            toast.error('Error generando el mutuo.');
        }
    };

    const handleWhatsApp = () => {
        if (!client.phone) {
            alert('El cliente no tiene numero de telefono');
            return;
        }

        const message = `Hola *${formData.clientName.trim()}*,\n\nAdjuntaremos los documentos de su prestamo.\n\nPor favor revise el pagare y el mutuo antes de firmarlos.`;
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = client.phone.replace(/\D/g, '');

        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');

        alert('Se abrira WhatsApp. Primero genera los documentos y luego adjuntalos manualmente al chat.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                        <Landmark className="text-blue-600" />
                        Documentos del Cliente
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nombre del Cliente</label>
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={(event) => setFormData((previous) => ({ ...previous, clientName: event.target.value }))}
                            className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">RUT</label>
                            <input
                                type="text"
                                value={formData.rut}
                                onChange={(event) => setFormData((previous) => ({ ...previous, rut: formatRutInput(event.target.value) }))}
                                className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                            />
                            {formData.rut && !isValidRut(formData.rut) && (
                                <p className="text-xs font-bold text-rose-500">Ingresa un RUT valido para generar documentos.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Prestamo</label>
                            {availableLoans.length > 1 ? (
                                <select
                                    value={selectedLoanId}
                                    onChange={(event) => setSelectedLoanId(event.target.value)}
                                    className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    {availableLoans.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {`${new Date(item.startDate).toLocaleDateString('es-CL')} - $${Number(item.amount || 0).toLocaleString('es-CL')} - ${item.status || 'Prestamo'}`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    ${Number(selectedLoan?.amount || 0).toLocaleString('es-CL')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Direccion</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(event) => setFormData((previous) => ({ ...previous, address: event.target.value }))}
                            className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                        />
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        <p>Estos documentos se rellenan automaticamente con el nombre, RUT y direccion del cliente para dejar listo el pagare y el mutuo.</p>
                    </div>
                </div>

                <div className="grid gap-3 bg-slate-50 p-6 dark:bg-slate-800/50 md:grid-cols-3">
                    <button
                        onClick={handleGeneratePagare}
                        disabled={!hasRequiredData}
                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FileText size={20} />
                        Pagare
                    </button>
                    <button
                        onClick={handleGenerateMutuo}
                        disabled={!hasRequiredData}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 font-bold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Landmark size={20} />
                        Mutuo
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white transition-colors hover:bg-green-600"
                    >
                        <MessageCircle size={20} />
                        WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PagareModal;
