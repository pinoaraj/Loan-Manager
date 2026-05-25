import React, { createContext, useContext, useCallback } from 'react';
// import { format, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

const LoanContext = createContext();

export const useLoans = () => useContext(LoanContext);

export const LoanProvider = ({ children }) => {
    const { token, fetchWithAuth } = useAuth();
    const queryClient = useQueryClient();

    // --- Queries ---

    // --- Queries ---

    // Dashboard Stats Query
    const { data: dashboardStats = { totalActiveLoans: 0, totalLent: 0, statusData: [], totalClients: 0 } } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            if (!token) return { totalActiveLoans: 0, totalLent: 0, statusData: [], totalClients: 0 };
            try {
                const res = await fetchWithAuth(`${API_URL}/dashboard/stats`);
                if (!res.ok) throw new Error('Failed to fetch stats');
                return res.json();
            } catch (e) {
                console.error(e);
                return { totalActiveLoans: 0, totalLent: 0, statusData: [], totalClients: 0 };
            }
        },
        enabled: !!token
    });

    // Alerts Query
    const { data: alerts = [] } = useQuery({
        queryKey: ['alerts'],
        queryFn: async () => {
            if (!token) return [];
            try {
                const res = await fetchWithAuth(`${API_URL}/dashboard/alerts`);
                if (!res.ok) throw new Error('Failed to fetch alerts');
                return res.json();
            } catch (e) {
                console.error(e);
                return [];
            }
        },
        enabled: !!token
    });

    // Projections Query
    const { data: projections = [] } = useQuery({
        queryKey: ['projections'],
        queryFn: async () => {
            if (!token) return [];
            try {
                const res = await fetchWithAuth(`${API_URL}/dashboard/projections`);
                if (!res.ok) throw new Error('Failed to fetch projections');
                return res.json();
            } catch (e) {
                console.error(e);
                return [];
            }
        },
        enabled: !!token
    });

    // Recent Activity Query
    const { data: recentActivity = [] } = useQuery({
        queryKey: ['recentActivity'],
        queryFn: async () => {
            if (!token) return [];
            try {
                const res = await fetchWithAuth(`${API_URL}/dashboard/recent`);
                if (!res.ok) throw new Error('Failed to fetch recent activity');
                return res.json();
            } catch (e) {
                console.error(e);
                return [];
            }
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
            try {
                // fetching default page
                const res = await fetchWithAuth(`${API_URL}/clients`);
                if (!res.ok) throw new Error('Failed to fetch clients');
                const json = await res.json();
                return Array.isArray(json) ? json : (json.data || []);
            } catch (e) {
                console.error(e);
                return [];
            }
        },
        enabled: !!token
    });

    const { data: loansData, isLoading: loansLoading } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            if (!token) return [];
            try {
                // fetching default page
                const res = await fetchWithAuth(`${API_URL}/loans`);
                if (!res.ok) throw new Error('Failed to fetch loans');
                const json = await res.json();
                return Array.isArray(json) ? json : (json.data || []);
            } catch (e) {
                console.error(e);
                return [];
            }
        },
        enabled: !!token
    });

    const clients = Array.isArray(clientsData) ? clientsData : [];
    const loans = Array.isArray(loansData) ? loansData : [];
    const loading = clientsLoading || loansLoading;

    // --- Actions (Mutations) ---

    // Generic helper to invalidate queries
    const invalidateData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['loans'] });
    }, [queryClient]);

    const addLoan = useCallback(async (loanData) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/loans`, {
                method: 'POST',
                body: JSON.stringify(loanData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || errorData.details || 'Failed to create loan');
            }

            const newLoan = await res.json();
            invalidateData();
            return { success: true, data: newLoan };
        } catch (error) {
            console.error('Error adding loan:', error);
            throw error;
        }
    }, [fetchWithAuth, invalidateData]);

    const addClient = useCallback(async (clientData) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/clients`, {
                method: 'POST',
                body: JSON.stringify(clientData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error adding client:', errorData);
                throw new Error(errorData.error || errorData.details || 'Failed to create client');
            }

            const newClient = await res.json();
            invalidateData();
            return { success: true, data: newClient };
        } catch (error) {
            console.error('Error adding client:', error);
            throw error;
        }
    }, [fetchWithAuth, invalidateData]);

    const updateClient = useCallback(async (clientId, clientData) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/clients/${clientId}`, {
                method: 'PUT',
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
    }, [fetchWithAuth, invalidateData]);

    const deleteClient = useCallback(async (clientId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/clients/${clientId}`, {
                method: 'DELETE'
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
    }, [fetchWithAuth, invalidateData]);

    const updateLoanStatus = useCallback(async (loanId, newStatus) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/loans/${loanId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error updating loan status:', error);
        }
    }, [fetchWithAuth, invalidateData]);

    const recalculateLoan = useCallback(async (loanId) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/loans/${loanId}/recalculate`, {
                method: 'POST'
            });
            if (res.ok) {
                const recalculatedLoan = await res.json();
                invalidateData();
                return { success: true, data: recalculatedLoan };
            }
            return { success: false };
        } catch (error) {
            console.error('Error recalculating loan:', error);
            return { success: false, error };
        }
    }, [fetchWithAuth, invalidateData]);

    const updatePaymentStatus = useCallback(async (paymentId, newStatus) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/payments/${paymentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) invalidateData();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    }, [fetchWithAuth, invalidateData]);

    const registerPayment = useCallback(async (paymentId, paymentData) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/payments/${paymentId}/transactions`, {
                method: 'POST',
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
    }, [fetchWithAuth, invalidateData]);

    const importData = useCallback(async (clientsData, loansData) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/import`, {
                method: 'POST',
                body: JSON.stringify({ clients: clientsData, loans: loansData })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.details || 'Failed to import data');
            }

            invalidateData();
            return { success: true, data };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    }, [fetchWithAuth, invalidateData]);

    const togglePause = useCallback(async (loanId, isPaused) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/loans/${loanId}/pause`, {
                method: 'PATCH',
                body: JSON.stringify({ isPaused })
            });
            if (res.ok) invalidateData();
            return res.ok;
        } catch (error) {
            console.error('Error toggling pause:', error);
            return false;
        }
    }, [fetchWithAuth, invalidateData]);

    const downloadReport = useCallback(async (type) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/reports/${type}`);
            if (!res.ok) throw new Error('Failed to download report');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Error al descargar el reporte.');
        }
    }, [fetchWithAuth]);

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

    const getLoanPreview = useCallback(async (params) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const res = await fetchWithAuth(`${API_URL}/loans/preview?${queryParams}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch preview');
            }
            return await res.json();
        } catch (error) {
            console.error('Error fetching loan preview:', error);
            throw error;
        }
    }, [fetchWithAuth]);

    // dashboardStats is now an object fetched from API
    // alerts is now an array fetched from API

    // Helper to get projections (now fetched from backend)
    const getCollectionProjections = () => projections;

    return (
        <LoanContext.Provider value={{
            clients, loans, loading,
            getClientLoans, getLoanSchedule,
            dashboardStats, alerts, recentActivity,
            addLoan, getCollectionProjections, getLoanPreview,
            updateLoanStatus, updatePaymentStatus,
            importData, addClient, recalculateLoan,
            updateClient, deleteClient, registerPayment, togglePause, downloadReport
        }}>
            {children}
        </LoanContext.Provider>
    );
};
