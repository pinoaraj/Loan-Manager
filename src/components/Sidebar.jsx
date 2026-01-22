import React from 'react';
import { LayoutDashboard, Users, Calculator, CreditCard, FileSpreadsheet, Moon, Sun, Download, ClipboardList, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import { exportData } from '../utils/dataExport';

const Sidebar = ({ isMobile }) => {
    const { alerts } = useLoans();
    const alertsCount = alerts?.length || 0;

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/collections', label: 'Cobranza', icon: ClipboardList },
        { path: '/clients', label: 'Clientes', icon: Users },
        { path: '/loans', label: 'Préstamos', icon: CreditCard },
        { path: '/calculator', label: 'Calculadora', icon: Calculator },
        { path: '/loans/new', label: 'Nuevo', icon: CreditCard }, // Shortened label
        { path: '/import', label: 'Importar', icon: FileSpreadsheet },
    ];

    if (isMobile) {
        // Simple mobile bottom nav for now
        return (
            <div className="glass-panel rounded-2xl p-2 flex justify-between items-center shadow-2xl">
                {menuItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `p-3 rounded-xl transition-all ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400'}`}
                        >
                            <Icon size={24} />
                        </NavLink>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="w-64 h-full glass-panel rounded-3xl flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-[var(--glass-border)]">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-500/20 flex items-center justify-center text-white">
                        LM
                    </div>
                    LoanManager
                </h1>
            </div>

            <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `group w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-teal-50/80 to-emerald-50/80 dark:from-teal-900/40 dark:to-emerald-900/40 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`absolute left-0 w-1 h-8 rounded-r-lg bg-teal-500 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 -translate-x-full'}`} />
                                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="font-medium tracking-wide">{item.label}</span>
                                    {item.path === '/collections' && alertsCount > 0 && (
                                        <span className="absolute right-3 bg-[var(--color-accent-500)] text-white text-[10px] font-bold px-2 py-0.5 rounded-pill shadow-lg shadow-rose-500/30 animate-pulse">
                                            {alertsCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--glass-border)]">
                <Footer />
            </div>
        </div>
    );
};

const Footer = () => {
    const { theme, toggleTheme } = useTheme();
    const { clients, loans } = useLoans();
    const { logout, user } = useAuth();

    return (
        <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{user?.username}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
                </div>
            </div>

            <button
                onClick={() => exportData(clients, loans)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-slate-700 hover:border-slate-600 mb-2"
            >
                <Download size={14} />
                Exportar Excel
            </button>
            <button
                onClick={async () => {
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('http://localhost:3001/api/backup', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error('Error downloading backup');

                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `backup-${new Date().toISOString().split('T')[0]}.db`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        toast.success('Respaldo descargado correctamente');
                    } catch (e) {
                        console.error(e);
                        toast.error('Error al descargar respaldo');
                    }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-slate-700 hover:border-slate-600"
            >
                <Download size={14} />
                Backup DB
            </button>
            <div className="flex items-center justify-between text-slate-400 text-sm">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 hover:text-red-400 transition-colors"
                >
                    <LogOut size={16} />
                    <span>Salir</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50">v1.0.0</span>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;
