import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Clock, CheckCircle, AlertTriangle, Edit, Trash2, MessageCircle, Send } from 'lucide-react';
import { generateWhatsAppLink, generateEmailLink } from '../utils/communication';
import { useLoans } from '../context/LoanContext';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientDetail = () => {
    const { id: clientId } = useParams();
    const navigate = useNavigate();
    const { clients, getClientLoans, updateClient, deleteClient } = useLoans();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Find client data
    const client = clients.find(c => c.id === clientId);
    // Get client loans
    const clientLoans = getClientLoans(clientId);

    const [editData, setEditData] = useState(client || {});

    if (!client) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Cliente no encontrado.</p>
                <button onClick={() => navigate('/clients')} className="mt-4 text-blue-600 hover:underline">Volver</button>
            </div>
        );
    }

    // Sort loans: Active first, then by date
    const sortedLoans = [...clientLoans].sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (a.status !== 'Active' && b.status === 'Active') return 1;
        return new Date(b.startDate) - new Date(a.startDate);
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Active': return <Clock size={14} />;
            case 'Paid': return <CheckCircle size={14} />;
            case 'Overdue': return <AlertTriangle size={14} />;
            default: return null;
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const success = await updateClient(client.id, editData);
        if (success) {
            setIsEditModalOpen(false);
        }
    };

    const handleDelete = async () => {
        if (clientLoans.length > 0) {
            alert('No se puede eliminar un cliente con préstamos asociados. Elimina los préstamos primero.');
            return;
        }

        if (window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
            const result = await deleteClient(client.id);
            if (result.success) {
                navigate('/clients');
            } else {
                alert('Error al eliminar: ' + result.error);
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/clients')}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Detalles del Cliente</h2>
                        <p className="text-slate-500 text-sm">Información completa e historial de préstamos</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <a
                        href={generateWhatsAppLink(client.phone, `Hola ${client.name}, le escribimos desde Loan Manager.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 hover:text-green-800 transition-colors font-semibold shadow-sm"
                    >
                        <MessageCircle size={16} />
                        WhatsApp
                    </a>
                    <a
                        href={generateEmailLink(client.email, 'Consulta Loan Manager', `Hola ${client.name},`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 hover:text-blue-800 transition-colors font-semibold shadow-sm"
                    >
                        <Send size={16} />
                        Email
                    </a>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => {
                            setEditData(client);
                            setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold shadow-sm"
                    >
                        <Edit size={16} />
                        Editar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors font-semibold shadow-sm"
                    >
                        <Trash2 size={16} />
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Client Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-blue-200 shrink-0">
                    {client.name.charAt(0)}
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{client.name}</h1>
                        <span className="text-sm font-mono text-slate-400">ID: {client.id}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        {clientLoans.some(l => l.status === 'Active') ? (
                            <span className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-blue-200 dark:ring-blue-700">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                Préstamo Activo
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-600">
                                Sin Préstamos Activos
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Mail size={18} className="text-blue-500" />
                            <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Phone size={18} className="text-blue-500" />
                            <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                            <MapPin size={18} className="text-blue-500" />
                            <span>{client.address}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right hidden md:block border-l border-slate-100 dark:border-slate-700 pl-8">
                    <p className="text-sm text-slate-500 mb-1">Total Prestado</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                        ${clientLoans.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        {clientLoans.filter(l => l.status === 'Active').length} Préstamos Activos
                    </p>
                </div>
            </div>

            {/* Loans History Section */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign className="text-blue-600" />
                    Historial de Préstamos
                </h3>

                {sortedLoans.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 border-dashed">
                        <p className="text-slate-400">Este cliente no tiene préstamos registrados.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sortedLoans.map(loan => (
                            <div
                                key={loan.id}
                                onClick={() => navigate(`/loans/${loan.id}`)}
                                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loan.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                            <DollarSign size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">${loan.amount.toLocaleString()}</p>
                                            <p className="text-sm text-slate-500">
                                                {format(parseISO(loan.startDate), 'd MMM, yyyy', { locale: es })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">Plazo</p>
                                            <p className="font-semibold text-slate-700">{loan.term} {loan.frequency === 'Monthly' ? 'Meses' : loan.frequency === 'Biweekly' ? 'Quincenas' : 'Semanas'}</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">Interés</p>
                                            <p className="font-semibold text-slate-700">{loan.rate}%</p>
                                        </div>

                                        <div className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${getStatusColor(loan.status)}`}>
                                            {getStatusIcon(loan.status)}
                                            {loan.status === 'Active' ? 'Activo' : loan.status === 'Paid' ? 'Pagado' : loan.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Editar Cliente</h3>
                            <p className="text-slate-500 text-sm">Actualiza los datos del cliente.</p>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={editData.email}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={editData.address}
                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
