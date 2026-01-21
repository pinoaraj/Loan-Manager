import React from 'react';
import { LayoutDashboard, Users, Calculator, CreditCard, FileSpreadsheet, Moon, Sun, Download, ClipboardList, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import { exportData } from '../utils/dataExport';

const Sidebar = () => {
    const { alerts } = useLoans();
    const alertsCount = alerts?.length || 0;

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/collections', label: 'Cobranza', icon: ClipboardList },
        { path: '/clients', label: 'Clientes', icon: Users },
        { path: '/loans', label: 'Préstamos', icon: CreditCard },
        { path: '/calculator', label: 'Calculadora', icon: Calculator },
        { path: '/loans/new', label: 'Nuevo Préstamo', icon: CreditCard },
        { path: '/import', label: 'Importar', icon: FileSpreadsheet },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white h-screen flex flex-col shadow-lg fixed md:relative z-20">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text">
                    LoanManager
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${isActive
                                ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                            {item.path === '/collections' && alertsCount > 0 && (
                                <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                                    {alertsCount}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-700">
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
