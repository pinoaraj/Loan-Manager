import React, { useState } from 'react';
import { useLoans } from '../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ImportData = () => {
    const navigate = useNavigate();
    const { importData, clients } = useLoans();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review
    const [rawRows, setRawRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [fileName, setFileName] = useState('');

    // Mapping state: which excel column maps to key fields
    const [mapping, setMapping] = useState({
        clientName: '',
        amount: '',
        date: '',
        duration: '',
        interest: ''
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (data.length > 0) {
                const header = data[0];
                const rows = data.slice(1).filter(r => r.length > 0);
                setColumns(header);
                setRawRows(rows);
                setStep(2);

                // Auto-guess mapping
                const lowerHeader = header.map(h => String(h).toLowerCase());
                const newMapping = { ...mapping };

                header.forEach((h, i) => {
                    const low = h.toString().toLowerCase();
                    if (low.includes('nom') || low.includes('name') || low.includes('cliente')) newMapping.clientName = h;
                    if (low.includes('mont') || low.includes('amount') || low.includes('prestamo')) newMapping.amount = h;
                    if (low.includes('fec') || low.includes('date') || low.includes('inicio')) newMapping.date = h;
                    if (low.includes('mes') || low.includes('plazo') || low.includes('duration')) newMapping.duration = h;
                    if (low.includes('int') || low.includes('rate') || low.includes('tasa')) newMapping.interest = h;
                });
                setMapping(newMapping);
            }
        };
        reader.readAsBinaryString(file);
    };

    const parseExcelDate = (val) => {
        if (!val) return new Date().toISOString().split('T')[0];
        // If it's a number (Excel date)
        if (typeof val === 'number') {
            const date = XLSX.SSF.parse_date_code(val);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
        // If it's already a string, try to normalize it
        if (typeof val === 'string') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
        return val;
    };

    const [previewData, setPreviewData] = useState({ clients: [], loans: [], skippedCount: 0 });

    const handleReview = () => {
        const newClients = [];
        const newLoans = [];
        const clientMap = new Map();
        let skippedCount = 0;

        rawRows.forEach((row, idx) => {
            const getVal = (field) => {
                const colName = mapping[field];
                const colIdx = columns.indexOf(colName);
                if (colIdx === -1) return null;
                return row[colIdx];
            };

            const name = String(getVal('clientName') || '').trim();
            const amountVal = getVal('amount');
            const amount = parseFloat(amountVal);

            // Validation: Skip if name missing or amount invalid
            if (!name || isNaN(amount) || amount <= 0) {
                skippedCount++;
                return;
            }

            let clientId;
            if (clientMap.has(name)) {
                clientId = clientMap.get(name);
            } else {
                const existing = clients.find(c => c.name.toLowerCase() === name.toLowerCase());
                if (existing) {
                    clientId = existing.id;
                } else {
                    clientId = `C-IMP-${Date.now()}-${idx}`;
                    newClients.push({
                        id: clientId,
                        name: name,
                        email: 'importado@example.com',
                        phone: '-',
                        address: '-',
                        isNew: true
                    });
                }
                clientMap.set(name, clientId);
            }

            newLoans.push({
                clientId: clientId,
                clientName: name,
                amount: amount,
                interestRate: parseFloat(getVal('interest')) || 0.1,
                durationMonths: parseInt(getVal('duration')) || 12,
                startDate: parseExcelDate(getVal('date'))
            });
        });

        setPreviewData({ clients: newClients, loans: newLoans, skippedCount });
        setStep(3);
    };

    const handleFinalConfirm = () => {
        setIsConfirmOpen(true);
    };

    const handleFinalConfirmAction = () => {
        importData(previewData.clients, previewData.loans);
        navigate('/loans');
    };

    return (
        <div className="p-8 space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Importar Datos</h2>
                <p className="text-slate-500">Sube tu Excel para cargar clientes y préstamos masivamente.</p>
            </header>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 dark:border-slate-700 max-w-3xl mx-auto">
                {/* Steps Visualizer could go here */}

                {step === 1 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-900">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet size={32} />
                            </div>
                            <span className="text-lg font-medium text-slate-700">Selecciona tu archivo Excel</span>
                            <span className="text-sm text-slate-400 mt-2">Soporta .xlsx, .xls, .csv</span>
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 bg-green-50 text-green-800 p-4 rounded-lg">
                            <FileSpreadsheet />
                            <span className="font-medium">Archivo cargado: {fileName}</span>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700">Asigna las columnas</h3>
                            <p className="text-sm text-slate-500">Relaciona las columnas de tu Excel con los datos de la App.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { k: 'clientName', label: 'Nombre Cliente' },
                                    { k: 'amount', label: 'Monto Préstamo' },
                                    { k: 'interest', label: 'Tasa Interés' },
                                    { k: 'duration', label: 'Plazo (Meses)' },
                                    { k: 'date', label: 'Fecha Inicio' }
                                ].map((field) => (
                                    <div key={field.k}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                                        <select
                                            value={mapping[field.k]}
                                            onChange={(e) => setMapping({ ...mapping, [field.k]: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">(Ignorar)</option>
                                            {columns.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-50">
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancelar</button>
                            <button
                                onClick={handleReview}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                            >
                                <ArrowRight size={18} />
                                Revisar Importación
                            </button>
                        </div>

                        {/* Preview Table */}
                        <div className="mt-8">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Vista Previa (Primeras 5 filas)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 font-medium">
                                        <tr>
                                            {columns.map((c, i) => <th key={i} className="px-3 py-2 border-b">{c}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {rawRows.slice(0, 5).map((row, i) => (
                                            <tr key={i}>
                                                {row.map((cell, j) => <td key={j} className="px-3 py-2 text-slate-600">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <span className="text-blue-600 font-bold text-2xl">{previewData.clients.length}</span>
                                <p className="text-blue-800 text-sm font-medium">Nuevos Clientes</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <span className="text-indigo-600 font-bold text-2xl">{previewData.loans.length}</span>
                                <p className="text-indigo-800 text-sm font-medium">Total Préstamos</p>
                            </div>
                        </div>

                        {previewData.skippedCount > 0 && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-700">
                                <AlertCircle size={24} />
                                <div>
                                    <p className="font-bold">Se omitieron {previewData.skippedCount} filas inválidas.</p>
                                    <p className="text-sm">Asegúrate de que la columna "Nombre" y "Monto" tengan valores válidos.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 border rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Cliente</th>
                                        <th className="px-4 py-3 border-b">Monto</th>
                                        <th className="px-4 py-3 border-b">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {previewData.loans.slice(0, 10).map((l, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3 text-slate-700 font-medium">{l.clientName}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono">${l.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-slate-500">{l.startDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.loans.length > 10 && (
                                <p className="p-3 text-center text-xs text-slate-400">Y {previewData.loans.length - 10} registros más...</p>
                            )}
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-50">
                            <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Atrás</button>
                            <button
                                onClick={handleFinalConfirm}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                            >
                                <Check size={18} />
                                Confirmar e Importar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleFinalConfirmAction}
                title="Confirmar Importación"
                message={`Estás a punto de importar ${previewData.clients.length} clientes nuevos y ${previewData.loans.length} préstamos. ¿Deseas continuar?`}
                confirmText="SÍ, IMPORTAR AHORA"
                type="success"
            />
        </div>
    );
};

export default ImportData;
