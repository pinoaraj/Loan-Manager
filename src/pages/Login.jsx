import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isLogin) {
            const result = await login(username, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } else {
            const result = await register(username, password);
            if (result.success) {
                alert('Cuenta creada. Ahora puedes iniciar sesion.');
                setIsLogin(true);
            } else {
                setError(result.error);
            }
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900 sm:p-6">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in duration-300 dark:bg-slate-800">
                <div className="px-6 pb-0 pt-6 text-center sm:px-8 sm:pt-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 sm:h-16 sm:w-16">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white sm:text-2xl">
                        {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        {isLogin
                            ? 'Ingresa tus credenciales para acceder a Loan Manager.'
                            : 'Crea tu usuario para comenzar a usar Loan Manager.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:space-y-6 sm:p-8">
                    {error && (
                        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Usuario</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-700/50"
                                    placeholder="Ingresa tu usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contrasena</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-700/50"
                                    placeholder="Escribe tu contrasena"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Crear Cuenta')}
                        {!loading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
                        >
                            {isLogin ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
