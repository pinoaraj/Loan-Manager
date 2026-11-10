import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoanProvider } from './context/LoanContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Loans = lazy(() => import('./pages/Loans'));
const NewLoan = lazy(() => import('./pages/NewLoan'));
const LoanDetail = lazy(() => import('./pages/LoanDetail'));
const Collections = lazy(() => import('./pages/Collections'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Login = lazy(() => import('./pages/Login'));
const ImportData = lazy(() => import('./pages/ImportData'));

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-sm font-medium text-slate-500">
    Cargando...
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const useResponsiveDesktopScale = () => {
  useEffect(() => {
    const root = document.documentElement;

    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const widthRatio = width / 1440;
      const heightRatio = height / 900;
      const scale = Math.min(widthRatio, heightRatio);
      const clampedScale = Math.max(0.82, Math.min(scale, 1.18));
      const shellGap = Math.round(Math.max(12, Math.min(28, 16 * clampedScale)));
      const contentPadding = Math.round(Math.max(14, Math.min(36, 24 * clampedScale)));
      const sidebarWidth = Math.round(Math.max(224, Math.min(320, 256 * clampedScale)));

      root.style.setProperty('--app-scale', clampedScale.toFixed(3));
      root.style.setProperty('--shell-gap', `${shellGap}px`);
      root.style.setProperty('--content-padding', `${contentPadding}px`);
      root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
};

const Layout = () => {
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      <div
        className="fixed z-50 hidden md:block"
        style={{
          left: 'var(--shell-gap)',
          top: 'var(--shell-gap)',
          bottom: 'var(--shell-gap)',
          width: 'var(--sidebar-width)'
        }}
      >
        <Sidebar />
      </div>
      <div
        className="fixed z-50 md:hidden"
        style={{
          left: 'var(--shell-gap)',
          right: 'var(--shell-gap)',
          bottom: 'var(--shell-gap)'
        }}
      >
        {/* Mobile Navigation would go here, or adapted Sidebar */}
        <Sidebar isMobile />
      </div>
      <main
        className="flex-1 overflow-y-auto min-w-0"
        style={{
          marginLeft: isMobileViewport ? '0px' : 'calc(var(--sidebar-width) + (var(--shell-gap) * 2))',
          padding: 'var(--content-padding)',
          paddingBottom: isMobileViewport ? 'calc(var(--content-padding) + 5rem)' : 'var(--content-padding)'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  useResponsiveDesktopScale();

  return (
    <ThemeProvider>
      <AuthProvider>
        <LoanProvider>
          <Router>
            <Toaster position="top-right" richColors closeButton />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/loans" element={<Loans />} />
                  <Route path="/loans/new" element={<NewLoan />} />
                  <Route path="/loans/:id" element={<LoanDetail />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/calculator" element={<Calculator />} />
                  <Route path="/import" element={<ImportData />} />
                </Route>
                <Route
                  path="*"
                  element={
                    <Navigate to="/" replace />
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </LoanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
