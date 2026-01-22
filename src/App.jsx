import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LoanProvider } from './context/LoanContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Loans from './pages/Loans';
import NewLoan from './pages/NewLoan';
import LoanDetail from './pages/LoanDetail';
import Collections from './pages/Collections';
import Calculator from './pages/Calculator';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      <div className="fixed left-4 top-4 bottom-4 z-50 hidden md:block">
        <Sidebar />
      </div>
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        {/* Mobile Navigation would go here, or adapted Sidebar */}
        <Sidebar isMobile />
      </div>
      <main className="flex-1 md:ml-[300px] p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoanProvider>
          <Router>
            <Toaster position="top-right" richColors closeButton />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/clients/:id" element={<ClientDetail />} />
                        <Route path="/loans" element={<Loans />} />
                        <Route path="/loans/new" element={<NewLoan />} />
                        <Route path="/loans/:id" element={<LoanDetail />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/calculator" element={<Calculator />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </LoanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
