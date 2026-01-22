import React, { createContext, useContext, useMemo } from 'react';
import { format, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const LoanContext = createContext();
const API_URL = 'http://localhost:3001/api';

export const useLoans = () => useContext(LoanContext);

export const LoanProvider = ({ children }) => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    // --- Queries ---

    // --- Queries ---

    // Dashboard Stats Query
    const { data: dashboardStats = { totalActiveLoans: 0, totalLent: 0, statusData: [], totalClients: 0 } } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            if (!token) return { totalActiveLoans: 0, totalLent: 0, statusData: [], totalClients: 0 };
            const res = await fetch(`${API_URL}/dashboard/stats`, { headers: getHeaders() });
            return res.json();
        },
        enabled: !!token
    });

    // Alerts Query
    const { data: alerts = [] } = useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            if (!token) return [];
            const res = await fetch(`${API_URL}/dashboard/alerts`, { headers: getHeaders() });
            return res.json();
        },
        enabled: !!token
    });

    // Projections Query
    const { data: projections = [] } = useQuery({
        queryKey: ['projections'],
        queryFn: async () => {
            if (!token) return [];
            const res = await fetch(`${API_URL}/dashboard/projections`, { headers: getHeaders() });
            return res.json();
        },
        enabled: !!token
    });

    // Recent Activity Query
    const { data: recentActivity = [] } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => {
            if (!token) return [];
            const res = await fetch(`${API_URL}/dashboard/recent`, { headers: getHeaders() });
            return res.json();
        },
        enabled: !!token
    });


    // Removed global fetching of ALL clients/loans to allow pagination in pages
    // kept empty arrays or removed logic requiring them globally?
    // Dashboard.jsx uses clients.length (now in dashboardStats.totalClients)
    // Clients.jsx uses clients list -> needs to be moved to Clients.jsx or paginated here.
    // Let's keep a simplified `useClients` hook export or just let pages handle it?
    // For now, to avoid breaking everything, let's keep the global fetches BUT make them paginated (defaults) 
    // OR just remove them and expose the fetcher.
    // Scalability best practice: Pages fetch what they need.
    // So we will NOT fetch them globally here.

    // However, for backward compatibility during this refactor step, we need to handle consumers.
    // usage: `const { clients } = useLoans()`
    // If we remove it, Clients page breaks.
    // So let's provide a "default" list (first page) or empty?
    // Let's keep the Hooks but move the queries to exported helpers so components can use them.

    // Actually, let's KEEP the global clients/loans for now but limited to 1000 items (default API) 
    // so we don't break existing list views immediately.
    // BUT we will update the internal logic to use the new endpoints.

    const { data: clientsData, isLoading: clientsLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            if (!token) return [];
            // fetching default page 1 (limit 1000)
            const res = await fetch(`${API_URL}/clients`, { headers: getHeaders() });
            const json = await res.json();
            return Array.isArray(json) ? json : (json.data || []);
        },
        enabled: !!token
    });

    const { data: loansData, isLoading: loansLoading } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            if (!token) return [];
            // fetching default page 1 (limit 1000)
            const res = await fetch(`${API_URL}/loans`, { headers: getHeaders() });
            const json = await res.json();
            return Array.isArray(json) ? json : (json.data || []);
        },
        enabled: !!token
    });

    const clients = Array.isArray(clientsData) ? clientsData : [];
    const loans = Array.isArray(loansData) ? loansData : [];
    const loading = clientsLoading || loansLoading;

    // --- Actions (Mutations) ---

    // Generic helper to invalidate queries
    const invalidateData = () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['loans'] });
    };

    const addLoan = async (loanData) => {
        try {
            const res = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(loanData)
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error adding loan:', error);
        }
    };

    const addClient = async (clientData) => {
        try {
            const res = await fetch(`${API_URL}/clients`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(clientData)
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error adding client:', error);
        }
    };

    const updateClient = async (clientId, clientData) => {
        try {
            const res = await fetch(`${API_URL}/clients/${clientId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(clientData)
            });
            if (res.ok) {
                invalidateData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating client:', error);
            return false;
        }
    };

    const deleteClient = async (clientId) => {
        try {
            const res = await fetch(`${API_URL}/clients/${clientId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                invalidateData();
                return { success: true };
            } else {
                const data = await res.json();
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const updateLoanStatus = async (loanId, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/loans/${loanId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error updating loan status:', error);
        }
    };

    const recalculateLoan = async (loanId) => {
        try {
            const res = await fetch(`${API_URL}/loans/${loanId}/recalculate`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (res.ok) {
                invalidateData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error recalculating loan:', error);
            return false;
        }
    };

    const updatePaymentStatus = async (paymentId, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/payments/${paymentId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const registerPayment = async (paymentId, paymentData) => {
        try {
            const res = await fetch(`${API_URL}/payments/${paymentId}/transactions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(paymentData)
            });
            if (res.ok) {
                invalidateData();
                return { success: true };
            } else {
                const data = await res.json();
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error registering payment:', error);
            return { success: false, error: 'Network error' };
        }
    };

    const importData = async (clientsData, loansData) => {
        try {
            const res = await fetch(`${API_URL}/import`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ clients: clientsData, loans: loansData })
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error importing data:', error);
        }
    };

    const togglePause = async (loanId, isPaused) => {
        try {
            const res = await fetch(`${API_URL}/loans/${loanId}/pause`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ isPaused })
            });
            if (res.ok) invalidateData();
            return res.ok;
        } catch (error) {
            console.error('Error toggling pause:', error);
            return false;
        }
    };

    // --- Selection / Computed Data ---

    const getClientLoans = (clientId) => {
        // Fallback: try to find in loaded loans (page 1)
        // ideally should fetch specific client loans from API if not found
        // But for "Client Detail" page, we should fetch from API in that component.
        // This helper might be deprecated or needs to be smart.
        return loans.filter(loan => loan.clientId === clientId);
    };

    const getLoanSchedule = (loan) => {
        return loan.payments || [];
    };

    // dashboardStats is now an object fetched from API
    // alerts is now an array fetched from API

    // Helper to get projections (now fetched from backend)
    const getCollectionProjections = () => projections;

    return (
        <LoanContext.Provider value={{
            clients, loans, loading,
            getClientLoans, getLoanSchedule,
            dashboardStats, alerts, recentActivity,
            addLoan, getCollectionProjections,
            updateLoanStatus, updatePaymentStatus,
            importData, addClient, recalculateLoan,
            updateClient, deleteClient, registerPayment, togglePause
        }}>
            {children}
        </LoanContext.Provider>
    );
};
