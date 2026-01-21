import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react';

const KPICard = ({ title, value, subtext, icon: Icon, color, trend, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
    >
        <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                <Icon size={22} className={color.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
            <p className="text-slate-500 font-medium text-sm">{title}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const DashboardKPI = ({ stats }) => {
    const navigate = useNavigate();

    // Robust defaults to prevent crash if API data is missing keys
    const safeStats = {
        totalLent: stats.totalLent || 0,
        monthlyCollection: stats.monthlyCollection || 0,
        activeClients: stats.activeClients || stats.totalClients || 0, // Fallback to totalClients
        healthScore: stats.healthScore || 0
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
                title="Total Prestado"
                value={`$${safeStats.totalLent.toLocaleString()}`}
                icon={DollarSign}
                color="bg-blue-600"
                subtext="Capital activo en circulación"
                onClick={() => navigate('/loans')}
            />
            <KPICard
                title="Cobranza Mensual"
                value={`$${safeStats.monthlyCollection.toLocaleString()}`}
                icon={TrendingUp}
                color="bg-emerald-600"
                subtext="Recaudado este mes"
                onClick={() => navigate('/collections')}
            />
            <KPICard
                title="Clientes Activos"
                value={safeStats.activeClients}
                icon={Users}
                color="bg-violet-600"
                subtext="Total de prestatarios únicos"
                onClick={() => navigate('/clients')}
            />
            <KPICard
                title="Tasa de Cartera"
                value={`${safeStats.healthScore}%`}
                icon={Activity}
                color="bg-indigo-600"
                trend={2.5}
                subtext="Préstamos al día"
                onClick={() => navigate('/loans?status=Active')}
            />
        </div>
    );
};

export default DashboardKPI;
