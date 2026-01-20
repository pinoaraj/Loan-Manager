import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'info' }) => {
    if (!isOpen) return null;

    const colors = {
        info: 'bg-blue-600 hover:bg-blue-700',
        danger: 'bg-rose-600 hover:bg-rose-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
        success: 'bg-emerald-600 hover:bg-emerald-700'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bg-white dark:bg-slate-800 text-slate-800 dark:text-white dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{message}</p>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl tborder-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-3 ${colors[type] || colors.info} text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
