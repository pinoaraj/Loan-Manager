import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// eslint-disable-next-line no-unused-vars
const KPICard = ({ title, value, subtext, icon: Icon, color, trend, onClick }) => (
    <div
        onClick={onClick}
        className="glass-panel rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 cursor-pointer"
    >
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    {title}
                </p>
                <h3 className="text-3xl font-display font-bold text-slate-800 dark:text-white tracking-tight">
                    {value}
                </h3>
                {subtext && (
                    <p className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1">
                        {subtext}
                    </p>
                )}
            </div>
            <div className={`p-3.5 rounded-2xl ${color} text-white shadow-lg shadow-black/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                <Icon size={24} />
            </div>
        </div>

        {/* Decorator Circle */}
        <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-all duration-500 ${color}`} />

        {trend && (
            <div className={`absolute bottom-6 right-6 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </div>
        )}
    </div>
);

const DashboardKPI = ({ stats }) => {
    const navigate = useNavigate();

    // Robust defaults to prevent crash if API data is missing keys
    const safeStats = {
        totalLent: stats.totalLent || 0,
        monthlyCollection: stats.monthlyCollection || 0,
        expectedCollection: stats.expectedCollection || 0,
        activeClients: stats.activeClients || stats.totalClients || 0, // Fallback to totalClients
        healthScore: stats.healthScore || 0,
        parAmount: stats.parAmount || 0
    };

    const collectionProgress = safeStats.expectedCollection > 0 
        ? Math.round((safeStats.monthlyCollection / safeStats.expectedCollection) * 100) 
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
                title="Total Prestado"
                value={`$${formatCurrency(safeStats.totalLent)}`}
                icon={DollarSign}
                color="bg-gradient-to-br from-blue-500 to-indigo-600"
                subtext={`$${formatCurrency(safeStats.parAmount)} en cuotas con riesgo`}
                onClick={() => navigate('/loans')}
            />
            <KPICard
                title="Cobranza Mensual"
                value={`$${formatCurrency(safeStats.monthlyCollection)}`}
                icon={TrendingUp}
                color="bg-gradient-to-br from-teal-400 to-emerald-600"
                subtext={`${collectionProgress}% de la meta ($${formatCurrency(safeStats.expectedCollection)})`}
                onClick={() => navigate('/collections')}
            />
            <KPICard
                title="Clientes Activos"
                value={safeStats.activeClients}
                icon={Users}
                color="bg-gradient-to-br from-violet-500 to-fuchsia-600"
                subtext="Total de prestatarios únicos"
                onClick={() => navigate('/clients')}
            />
            <KPICard
                title="Salud de Cartera"
                value={`${safeStats.healthScore}%`}
                icon={Activity}
                color="bg-gradient-to-br from-rose-500 to-orange-500"
                subtext="Préstamos al día"
                onClick={() => navigate('/loans?status=Active')}
            />
        </div>
    );
};

export default DashboardKPI;
