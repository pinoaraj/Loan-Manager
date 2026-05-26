import React from 'react';
import { LayoutDashboard, Users, Calculator, CreditCard, FileSpreadsheet, Moon, Sun, Download, ClipboardList, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../context/useTheme';
import { useLoans } from '../context/useLoans';
import { useAuth } from '../context/useAuth';
import { API_URL } from '../config/api';

const APP_VERSION = import.meta.env.VITE_APP_VERSION;
const APP_BUILD_STAMP = import.meta.env.VITE_APP_BUILD_STAMP;

const Sidebar = ({ isMobile }) => {
    const { alerts } = useLoans();
    const alertsCount = alerts?.length || 0;

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/collections', label: 'Cobranza', icon: ClipboardList },
        { path: '/clients', label: 'Clientes', icon: Users },
        { path: '/loans', label: 'Prestamos', icon: CreditCard },
        { path: '/calculator', label: 'Calculadora', icon: Calculator },
        { path: '/loans/new', label: 'Nuevo', icon: CreditCard },
        { path: '/import', label: 'Importar', icon: FileSpreadsheet },
    ];

    if (isMobile) {
        return (
            <div className="glass-panel flex items-center justify-between rounded-2xl p-2 shadow-2xl">
                {menuItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `rounded-xl p-3 transition-all ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400'}`}
                        >
                            <Icon size={24} />
                        </NavLink>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="glass-panel flex h-full w-full min-w-0 flex-col rounded-3xl transition-all duration-300">
            <div className="border-b border-[var(--glass-border)] p-6">
                <h1 className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-500/20">
                        LM
                    </div>
                    LoanManager
                </h1>
            </div>

            <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `group relative flex w-full items-center space-x-3 overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 ${isActive
                                ? 'bg-gradient-to-r from-teal-50/80 to-emerald-50/80 font-bold text-teal-600 shadow-sm dark:from-teal-900/40 dark:to-emerald-900/40 dark:text-teal-400'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`absolute left-0 h-8 w-1 rounded-r-lg bg-teal-500 transition-all duration-300 ${isActive ? 'opacity-100' : '-translate-x-full opacity-0'}`} />
                                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="font-medium tracking-wide">{item.label}</span>
                                    {item.path === '/collections' && alertsCount > 0 && (
                                        <span className="absolute right-3 rounded-pill bg-[var(--color-accent-500)] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
                                            {alertsCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="border-t border-[var(--glass-border)] p-4">
                <Footer />
            </div>
        </div>
    );
};

const Footer = () => {
    const { theme, toggleTheme } = useTheme();
    const { logout, user, fetchWithAuth } = useAuth();

    const handleExportData = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/reports/export-all`);
            if (!response.ok) {
                throw new Error('Error exporting data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `LoanManager_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Exportacion completa descargada correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al exportar la informacion');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-bold">{user?.username}</p>
                    <p className="truncate text-xs capitalize text-slate-400">{user?.role}</p>
                </div>
            </div>

            <button
                onClick={handleExportData}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
                <Download size={14} />
                Exportar Excel
            </button>
            <button
                onClick={async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_URL}/backup`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) {
                            throw new Error('Error downloading backup');
                        }

                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `backup-${new Date().toISOString().split('T')[0]}.db`;
                        document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                        toast.success('Respaldo descargado correctamente');
                    } catch (error) {
                        console.error(error);
                        toast.error('Error al descargar respaldo');
                    }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
                <Download size={14} />
                Backup DB
            </button>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-300">Version {APP_VERSION}</p>
                <p className="truncate">Build {APP_BUILD_STAMP}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
                <button onClick={logout} className="flex items-center gap-2 transition-colors hover:text-red-400">
                    <LogOut size={16} />
                    <span>Salir</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50">v{APP_VERSION}</span>
                    <button
                        onClick={toggleTheme}
                        className="rounded-lg p-2 transition-colors hover:bg-slate-800 hover:text-white"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
