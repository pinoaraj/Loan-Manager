import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLoans } from '../context/useLoans';
import ConfirmModal from '../components/ConfirmModal';
import { downloadBulkLoanCalendars } from '../utils/calendar';
import { formatCurrency } from '../utils/formatters';

let xlsxModulePromise;

const loadXlsx = async () => {
    if (!xlsxModulePromise) {
        xlsxModulePromise = import('xlsx');
    }

    return xlsxModulePromise;
};

const ImportData = () => {
    const navigate = useNavigate();
    const { importData, clients } = useLoans();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [rawRows, setRawRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [mapping, setMapping] = useState({
        clientName: '',
        rut: '',
        amount: '',
        date: '',
        duration: '',
        interest: ''
    });
    const [previewData, setPreviewData] = useState({ clients: [], loans: [], skippedCount: 0 });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const XLSX = await loadXlsx();
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (data.length === 0) {
                    toast.error('El archivo no contiene filas para importar');
                    return;
                }

                const header = data[0];
                const rows = data.slice(1).filter((row) => row.length > 0);
                setColumns(header);
                setRawRows(rows);
                setStep(2);

                const nextMapping = { ...mapping };
                header.forEach((column) => {
                    const normalized = column.toString().toLowerCase();
                    if (normalized.includes('nom') || normalized.includes('name') || normalized.includes('cliente')) nextMapping.clientName = column;
                    if (normalized.includes('rut')) nextMapping.rut = column;
                    if (normalized.includes('mont') || normalized.includes('amount') || normalized.includes('prestamo')) nextMapping.amount = column;
                    if (normalized.includes('fec') || normalized.includes('date') || normalized.includes('inicio')) nextMapping.date = column;
                    if (normalized.includes('mes') || normalized.includes('plazo') || normalized.includes('duration')) nextMapping.duration = column;
                    if (normalized.includes('int') || normalized.includes('rate') || normalized.includes('tasa')) nextMapping.interest = column;
                });
                setMapping(nextMapping);
            } catch (error) {
                console.error(error);
                toast.error('No se pudo leer el archivo seleccionado');
            }
        };
        reader.readAsBinaryString(file);
    };

    const parseExcelDate = async (value) => {
        if (!value) {
            return new Date().toISOString().split('T')[0];
        }

        if (typeof value === 'number') {
            const XLSX = await loadXlsx();
            const date = XLSX.SSF.parse_date_code(value);
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }

        if (typeof value === 'string') {
            const date = new Date(value);
            if (!Number.isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }

        return value;
    };

    const handleReview = async () => {
        const newClients = [];
        const newLoans = [];
        const clientMap = new Map();
        let skippedCount = 0;

        for (const [idx, row] of rawRows.entries()) {
            const getValue = (field) => {
                const columnName = mapping[field];
                const columnIndex = columns.indexOf(columnName);
                if (columnIndex === -1) {
                    return null;
                }

                return row[columnIndex];
            };

            const name = String(getValue('clientName') || '').trim();
            const rut = String(getValue('rut') || '').trim();
            const amount = parseFloat(getValue('amount'));

            if (!name || Number.isNaN(amount) || amount <= 0) {
                skippedCount++;
                continue;
            }

            const clientKey = rut || name.toLowerCase();
            let clientId;
            if (clientMap.has(clientKey)) {
                clientId = clientMap.get(clientKey);
            } else {
                const existingClient = clients.find((client) =>
                    (rut && client.rut && client.rut.toLowerCase() === rut.toLowerCase()) ||
                    client.name.toLowerCase() === name.toLowerCase()
                );
                if (existingClient) {
                    clientId = existingClient.id;
                } else {
                    if (!rut) {
                        skippedCount++;
                        continue;
                    }

                    clientId = `C-IMP-${Date.now()}-${idx}`;
                    newClients.push({
                        id: clientId,
                        name,
                        rut,
                        email: 'importado@example.com',
                        phone: '-',
                        address: '-',
                        isNew: true
                    });
                }
                clientMap.set(clientKey, clientId);
            }

            newLoans.push({
                clientId,
                clientName: name,
                amount,
                interestRate: parseFloat(getValue('interest')) || 0.1,
                durationMonths: parseInt(getValue('duration')) || 12,
                startDate: await parseExcelDate(getValue('date'))
            });
        }

        setPreviewData({ clients: newClients, loans: newLoans, skippedCount });
        setStep(3);
    };

    const handleFinalConfirmAction = async () => {
        setIsImporting(true);
        const result = await importData(previewData.clients, previewData.loans);
        setIsImporting(false);

        if (!result.success) {
            toast.error(result.error || 'No se pudo importar el archivo');
            return;
        }

        const previewClientMap = new Map(previewData.clients.map((client) => [client.id, client]));
        const importedClientMap = new Map(clients.map((client) => [client.id, client]));

        (result.data?.createdClients || []).forEach(({ oldId, newId }) => {
            const previewClient = previewClientMap.get(oldId);
            if (previewClient) {
                importedClientMap.set(newId, previewClient);
            }
        });

        const calendarEntries = (result.data?.createdLoans || []).map(({ loan, payments }) => ({
            loan: { ...loan, payments },
            client: importedClientMap.get(loan.clientId) || { name: 'Cliente importado' }
        }));

        downloadBulkLoanCalendars(calendarEntries, `loan-manager-importacion-${new Date().toISOString().slice(0, 10)}.ics`);
        toast.success('Importacion completada correctamente');
        setIsConfirmOpen(false);
        navigate('/loans');
    };

    return (
        <div className="space-y-8 p-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Importar Datos</h2>
                <p className="text-slate-500">Sube tu Excel para cargar clientes y prestamos masivamente.</p>
            </header>

            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {step === 1 && (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center transition-colors hover:border-blue-500 dark:bg-slate-900">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <FileSpreadsheet size={32} />
                            </div>
                            <span className="text-lg font-medium text-slate-700">Selecciona tu archivo Excel</span>
                            <span className="mt-2 text-sm text-slate-400">Soporta .xlsx, .xls, .csv</span>
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800">
                            <FileSpreadsheet />
                            <span className="font-medium">Archivo cargado: {fileName}</span>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700">Asigna las columnas</h3>
                            <p className="text-sm text-slate-500">Relaciona las columnas de tu Excel con los datos de la app.</p>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {[
                                    { k: 'clientName', label: 'Nombre Cliente' },
                                    { k: 'rut', label: 'RUT Cliente' },
                                    { k: 'amount', label: 'Monto Prestamo' },
                                    { k: 'interest', label: 'Tasa Interes' },
                                    { k: 'duration', label: 'Plazo (Meses)' },
                                    { k: 'date', label: 'Fecha Inicio' }
                                ].map((field) => (
                                    <div key={field.k}>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
                                        <select
                                            value={mapping[field.k]}
                                            onChange={(e) => setMapping({ ...mapping, [field.k]: e.target.value })}
                                            className="w-full rounded-lg border border-slate-200 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">(Ignorar)</option>
                                            {columns.map((column) => (
                                                <option key={column} value={column}>{column}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-50 pt-6">
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancelar</button>
                            <button
                                onClick={handleReview}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                <ArrowRight size={18} />
                                Revisar Importacion
                            </button>
                        </div>

                        <div className="mt-8">
                            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Vista Previa (Primeras 5 filas)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 font-medium text-slate-600 dark:bg-slate-900">
                                        <tr>
                                            {columns.map((column, i) => <th key={i} className="border-b px-3 py-2">{column}</th>)}
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
                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <span className="text-2xl font-bold text-blue-600">{previewData.clients.length}</span>
                                <p className="text-sm font-medium text-blue-800">Nuevos Clientes</p>
                            </div>
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                <span className="text-2xl font-bold text-indigo-600">{previewData.loans.length}</span>
                                <p className="text-sm font-medium text-indigo-800">Total Prestamos</p>
                            </div>
                        </div>

                        {previewData.skippedCount > 0 && (
                            <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
                                <AlertCircle size={24} />
                                <div>
                                    <p className="font-bold">Se omitieron {previewData.skippedCount} filas invalidas.</p>
                                    <p className="text-sm">Asegurate de que "Nombre", "Monto" y el "RUT" de clientes nuevos tengan valores validos.</p>
                                </div>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 font-medium text-slate-600 dark:bg-slate-900">
                                    <tr>
                                        <th className="border-b px-4 py-3">Cliente</th>
                                        <th className="border-b px-4 py-3">Monto</th>
                                        <th className="border-b px-4 py-3">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {previewData.loans.slice(0, 10).map((loan, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3 font-medium text-slate-700">{loan.clientName}</td>
                                            <td className="px-4 py-3 font-mono text-slate-600">${formatCurrency(loan.amount)}</td>
                                            <td className="px-4 py-3 text-slate-500">{loan.startDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.loans.length > 10 && (
                                <p className="p-3 text-center text-xs text-slate-400">Y {previewData.loans.length - 10} registros mas...</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-50 pt-6">
                            <button onClick={() => setStep(2)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Atras</button>
                            <button
                                onClick={() => setIsConfirmOpen(true)}
                                disabled={isImporting || previewData.loans.length === 0}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
                            >
                                <Check size={18} />
                                {isImporting ? 'Importando...' : 'Confirmar e Importar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleFinalConfirmAction}
                title="Confirmar Importacion"
                message={`Estas a punto de importar ${previewData.clients.length} clientes nuevos y ${previewData.loans.length} prestamos. Deseas continuar?`}
                confirmText="SI, IMPORTAR AHORA"
                type="success"
            />
        </div>
    );
};

export default ImportData;
