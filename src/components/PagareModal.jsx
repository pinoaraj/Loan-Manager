import React, { useEffect, useState } from 'react';
import { X, FileText, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

const PagareModal = ({ isOpen, onClose, loan, client }) => {
    const loanInterestRate = Number(loan?.interestRate ?? loan?.rate ?? 0);
    const [formData, setFormData] = useState({
        clientName: '',
        id: '',
        amount: '',
        date: '',
        city: 'Santa Cruz',
        rate: '',
    });

    useEffect(() => {
        if (loan && client) {
            setFormData({
                clientName: client.name,
                id: client.id,
                amount: loan.amount.toFixed(2),
                date: format(new Date(), 'dd/MM/yyyy'),
                city: 'Santa Cruz',
                rate: (loanInterestRate * 100).toFixed(1),
            });
        }
    }, [loan, client, isOpen, loanInterestRate]);

    if (!isOpen) {
        return null;
    }

    const handleGenerate = async () => {
        try {
            const { generatePagareFromTemplate } = await import('../utils/pagareGenerator');
            generatePagareFromTemplate({
                ...formData,
                loanAmount: formData.amount
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error generando el documento');
        }
    };

    const handleWhatsApp = () => {
        if (!client.phone) {
            alert('El cliente no tiene numero de telefono');
            return;
        }

        const message = `Hola *${formData.clientName}*,\n\nAdjunto enviamos el pagare correspondiente a su prestamo de *$${formData.amount}*.\n\nPor favor reviselo.`;
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = client.phone.replace(/\D/g, '');

        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');

        alert('Se abrira WhatsApp.\n\nIMPORTANTE: Debido a restricciones de seguridad del navegador, no podemos adjuntar el archivo automaticamente.\n\nPor favor, GENERE el documento primero y luego ARRASTRELO al chat de WhatsApp.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                        <FileText className="text-blue-600" />
                        Generar Pagare
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
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Monto</label>
                            <input
                                type="text"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tasa (%)</label>
                            <input
                                type="text"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Fecha</label>
                            <input
                                type="text"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ciudad</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full rounded-xl border-none bg-slate-50 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        <p>Nota: edita los datos si hace falta. Estos valores se insertaran en la plantilla Word.</p>
                    </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-6 dark:bg-slate-800/50">
                    <button
                        onClick={handleGenerate}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                    >
                        <FileText size={20} />
                        Generar Word
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-bold text-white transition-colors hover:bg-green-600"
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
