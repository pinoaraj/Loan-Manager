import React, { useState } from 'react';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, MapPin, MessageCircle, CreditCard, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config/api';
import { generateWhatsAppLink, hasPhoneNumber } from '../utils/communication';

const isValidEmail = (value) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value);

const Clients = () => {
    const navigate = useNavigate();
    const { addClient, loans } = useLoans(); // Keep loans for calculating debt (or move debt calc to backend?)
    const { token, fetchWithAuth } = useAuth();

    // Pagination State
    const [page, setPage] = useState(1);
    const limit = 10;
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [formErrors, setFormErrors] = useState({});

    // Fetch Clients with Pagination
    const { data: clientsData = { data: [], meta: {} } } = useQuery({
        queryKey: ['clients', page, limit], // Include search term later?
        queryFn: async () => {
            const res = await fetchWithAuth(`${API_URL}/clients?page=${page}&limit=${limit}`);
            return res.json();
        },
        keepPreviousData: true, // Keep old data while fetching new page
        enabled: !!token && typeof fetchWithAuth === 'function'
    });

    const clients = clientsData.data || [];
    const meta = clientsData.meta || {};

    // Filter Logic - Ideally searching should be backend-side for scalability
    // But for now, we filter the fetched page (which is limited).
    // If we want real search, we need backend search.
    // Let's stick to frontend search of the current page for now, OR remove search if it conflicts with pagination (searching only 10 items is useless).
    // Correct approach: Add ?search= parameter to backend.
    // For now, let's just display the paginated list and assume search only works on visible items (or remove search for this iteration).
    // Let's keep the filter but acknowledge it only filters the current page.

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = async (e) => {
        e.preventDefault();
        const normalizedClient = {
            name: newClient.name.trim(),
            email: newClient.email.trim(),
            phone: newClient.phone.trim(),
            address: newClient.address.trim()
        };

        const nextErrors = {};
        if (!normalizedClient.name) nextErrors.name = 'El nombre es obligatorio.';
        if (normalizedClient.email && !isValidEmail(normalizedClient.email)) {
            nextErrors.email = 'Ingresa un email valido, por ejemplo nombre@correo.com.';
        }
        if (!normalizedClient.phone) nextErrors.phone = 'El telefono es obligatorio.';
        if (!normalizedClient.address) nextErrors.address = 'La direccion es obligatoria.';

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        try {
            await addClient(normalizedClient);
            setIsModalOpen(false);
            setNewClient({ name: '', email: '', phone: '', address: '' });
            setFormErrors({});
            // Invalidate query handled by context
        } catch (error) {
            alert('Error al crear cliente: ' + error.message);
            console.error('Client creation failed:', error);
        }
    };

    const getClientDebt = (clientId) => {
        // This still relies on ALL loans being loaded in context.
        // If we paginate loans too, this will break.
        // Ideally this should be part of the client object return from backend (e.g., client.totalDebt).
        // For Phase 2, relying on context loans (1000 limit) is an acceptable interim state.
        return loans
            .filter(l => l.clientId === clientId && l.status === 'Active')
            .reduce((acc, curr) => acc + curr.amount, 0);
    };

    return (
        <div className="p-8 space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Clientes</h2>
                    <p className="text-slate-500">Gestiona tu base de datos de clientes y su historial.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Nombre, email o ID..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                    >
                        <Users size={18} />
                        Nuevo Cliente
                    </button>
                </div>
            </header>

            {/* Modal for New Client */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Cliente</h3>
                            <p className="text-slate-500 text-sm">Ingresa los datos del nuevo cliente.</p>
                        </div>
                        <form noValidate onSubmit={handleAddClient} className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newClient.name}
                                    onChange={(e) => {
                                        setNewClient({ ...newClient, name: e.target.value });
                                        setFormErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                />
                                {formErrors.name && <p className="text-xs font-bold text-rose-500">{formErrors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email (Opcional)</label>
                                <input
                                    type="email"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newClient.email}
                                    onChange={(e) => {
                                        setNewClient({ ...newClient, email: e.target.value });
                                        setFormErrors(prev => ({ ...prev, email: '' }));
                                    }}
                                />
                                {formErrors.email && <p className="text-xs font-bold text-rose-500">{formErrors.email}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newClient.phone}
                                    onChange={(e) => {
                                        setNewClient({ ...newClient, phone: e.target.value });
                                        setFormErrors(prev => ({ ...prev, phone: '' }));
                                    }}
                                />
                                {formErrors.phone && <p className="text-xs font-bold text-rose-500">{formErrors.phone}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={newClient.address}
                                    onChange={(e) => {
                                        setNewClient({ ...newClient, address: e.target.value });
                                        setFormErrors(prev => ({ ...prev, address: '' }));
                                    }}
                                />
                                {formErrors.address && <p className="text-xs font-bold text-rose-500">{formErrors.address}</p>}
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200">
                        <Users className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500">No se encontraron clientes.</p>
                    </div>
                ) : (
                    filteredClients.map(client => {
                        const debt = getClientDebt(client.id);
                        return (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{client.name}</h3>
                                            <span className="text-xs text-slate-400 font-mono">ID: {client.id}</span>
                                        </div>
                                    </div>
                                    {debt > 0 && (
                                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                                            ${debt.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <span>{client.email || 'Sin email registrado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <span>{client.phone || 'Sin telefono registrado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <span>{client.address || 'Sin direccion registrada'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/clients/${client.id}`);
                                        }}
                                        className="flex-1 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={14} />
                                        Historial
                                    </button>
                                    {hasPhoneNumber(client.phone) && (
                                        <a
                                            href={generateWhatsAppLink(client.phone, `Hola ${client.name}, le escribimos desde Loan Manager.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-12 bg-slate-50 hover:bg-green-50 hover:text-green-600 text-slate-400 py-2.5 rounded-xl flex items-center justify-center transition-colors"
                                            title="Contactar por WhatsApp"
                                        >
                                            <MessageCircle size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
                <button
                    onClick={() => setPage(old => Math.max(old - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Página {page} {meta.totalPages ? `de ${meta.totalPages}` : ''}
                </span>
                <button
                    onClick={() => {
                        if (!meta.totalPages || page < meta.totalPages) {
                            setPage(old => old + 1);
                        }
                    }}
                    disabled={meta.totalPages ? page >= meta.totalPages : false}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default Clients;
