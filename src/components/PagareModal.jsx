import React, { useState, useEffect } from 'react';
import { X, FileText, MessageCircle } from 'lucide-react';
import { generatePagareFromTemplate } from '../utils/wordGenerator';
import { format } from 'date-fns';
// import { es } from 'date-fns/locale';

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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    if (!isOpen) return null;

    const handleGenerate = () => {
        try {
            generatePagareFromTemplate({
                ...formData,
                loanAmount: formData.amount // Mapping for template if needed
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error generando el documento');
        }
    };

    const handleWhatsApp = () => {
        if (!client.phone) {
            alert('El cliente no tiene número de teléfono');
            return;
        }

        const message = `Hola *${formData.clientName}*,\n\nAdjunto enviamos el pagaré correspondiente a su préstamo de *$${formData.amount}*.\n\nPor favor revíselo.`;
        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = client.phone.replace(/\D/g, '');

        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');

        alert('Se abrirá WhatsApp.\n\nIMPORTANTE: Debido a restricciones de seguridad del navegador, no podemos adjuntar el archivo automáticamente.\n\nPor favor, GENERE el documento primero y luego ARRÁSTRELO al chat de WhatsApp.');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Generar Pagaré
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nombre del Cliente</label>
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Monto</label>
                            <input
                                type="text"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tasa (%)</label>
                            <input
                                type="text"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ciudad</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                        <p>ℹ️ Edite los datos según sea necesario. Estos valores se insertarán en la plantilla Word.</p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                    <button
                        onClick={handleGenerate}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                    >
                        <FileText size={20} />
                        Generar Word
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-colors"
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
