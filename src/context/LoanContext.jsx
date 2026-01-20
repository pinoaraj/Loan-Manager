import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { format, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { useAuth } from './AuthContext';

const LoanContext = createContext();
const API_URL = 'http://localhost:3001/api';

export const useLoans = () => useContext(LoanContext);

export const LoanProvider = ({ children }) => {
    const { token } = useAuth();
    const [clients, setClients] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    const fetchData = async () => {
        if (!token) return;

        try {
            const [clientsRes, loansRes] = await Promise.all([
                fetch(`${API_URL}/clients`, { headers: getHeaders() }),
                fetch(`${API_URL}/loans`, { headers: getHeaders() })
            ]);

            if (clientsRes.ok && loansRes.ok) {
                const clientsData = await clientsRes.json();
                const loansData = await loansRes.json();
                setClients(clientsData);
                setLoans(loansData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        } else {
            setClients([]);
            setLoans([]);
            setLoading(false);
        }
    }, [token]);

    const getClientLoans = (clientId) => {
        return loans.filter(loan => loan.clientId === clientId);
    };

    const getLoanSchedule = (loan) => {
        // In the new architecture, payments are stored in the DB
        return loan.payments || [];
    };

    const dashboardStats = () => {
        const totalActiveLoans = loans.filter(l => l.status === 'Active').length;
        const totalLent = loans.reduce((acc, curr) => acc + curr.amount, 0);

        const statusData = [
            { name: 'Activos', value: totalActiveLoans, color: '#3b82f6' },
            { name: 'Pagados', value: loans.filter(l => l.status === 'Paid').length, color: '#10b981' },
            { name: 'Vencidos', value: loans.filter(l => l.status === 'Overdue').length, color: '#ef4444' },
        ].filter(d => d.value > 0);

        return { totalActiveLoans, totalLent, statusData };
    };

    const getCollectionProjections = () => {
        const projections = {};
        const today = new Date();

        loans.forEach(loan => {
            if (loan.status !== 'Active') return;
            const schedule = getLoanSchedule(loan);
            schedule.forEach(p => {
                const date = parseISO(p.dueDate);
                if (isAfter(date, today) && p.status === 'Pending') {
                    const monthKey = format(date, 'MMM yy');
                    projections[monthKey] = (projections[monthKey] || 0) + p.amount;
                }
            });
        });

        return Object.entries(projections)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => new Date(a.month) - new Date(b.month))
            .slice(0, 6);
    };

    const addLoan = async (loanData) => {
        try {
            const res = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(loanData)
            });
            if (res.ok) await fetchData();
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
            if (res.ok) await fetchData();
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
            if (res.ok) await fetchData();
            return res.ok;
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
                await fetchData();
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
            if (res.ok) await fetchData();
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
            if (res.ok) await fetchData();
            return res.ok;
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
            if (res.ok) await fetchData();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const registerPayment = async (paymentId, paymentData) => {
        try {
            const res = await fetch(`${API_URL}/payments/${paymentId / transactions}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(paymentData)
            });
            if (res.ok) {
                await fetchData();
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

    const alerts = useMemo(() => {
        const today = startOfDay(new Date());
        const resultingAlerts = [];

        loans.forEach(loan => {
            if (loan.status !== 'Active') return;

            const schedule = getLoanSchedule(loan);
            const pendingPayments = schedule.filter(p => p.status === 'Pending');

            pendingPayments.forEach(payment => {
                const dueDate = startOfDay(parseISO(payment.dueDate));

                if (isAfter(today, dueDate)) {
                    resultingAlerts.push({
                        type: 'overdue',
                        loanId: loan.id,
                        clientName: clients.find(c => c.id === loan.clientId)?.name || 'Unknown',
                        amount: payment.amount,
                        dueDate: payment.dueDate,
                        daysOverdue: differenceInDays(today, dueDate)
                    });
                }
                else {
                    const diffDays = differenceInDays(dueDate, today);
                    if (diffDays >= 0 && diffDays <= 7) {
                        resultingAlerts.push({
                            type: 'upcoming',
                            loanId: loan.id,
                            clientName: clients.find(c => c.id === loan.clientId)?.name || 'Unknown',
                            amount: payment.amount,
                            dueDate: payment.dueDate,
                            daysUntil: diffDays
                        });
                    }
                }
            });
        });

        return resultingAlerts.sort((a, b) => {
            if (a.type === 'overdue' && b.type !== 'overdue') return -1;
            if (a.type !== 'overdue' && b.type === 'overdue') return 1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }, [loans, clients]);

    const importData = async (clientsData, loansData) => {
        try {
            const res = await fetch(`${API_URL}/import`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ clients: clientsData, loans: loansData })
            });
            if (res.ok) await fetchData();
        } catch (error) {
            console.error('Error importing data:', error);
        }
    };

    return (
        <LoanContext.Provider value={{
            clients, loans, loading,
            getClientLoans, getLoanSchedule,
            dashboardStats, alerts,
            addLoan, getCollectionProjections,
            updateLoanStatus, updatePaymentStatus,
            importData, addClient, recalculateLoan,
            updateClient, deleteClient, registerPayment
        }}>
            {children}
        </LoanContext.Provider>
    );
};
