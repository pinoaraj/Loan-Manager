import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoanDetail from './LoanDetail';

const mockLoan = vi.hoisted(() => ({
    id: 'loan-1',
    clientId: 'client-1',
    amount: 1200,
    interestRate: 0.1,
    durationMonths: 6,
    startDate: '2026-05-26T00:00:00.000Z',
    loanType: 'Fixed',
    frequency: 'monthly',
    isPaused: false,
    payments: [
        {
            id: 'pay-1',
            dueDate: '2026-06-26T00:00:00.000Z',
            amount: 220,
            principal: 180,
            interest: 40,
            lateFee: 0,
            paidAmount: 0,
            status: 'Pending',
            transactions: []
        }
    ],
    client: {
        id: 'client-1',
        name: 'Cliente Demo'
    }
}));

vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({
        data: mockLoan,
        isLoading: false
    })
}));

vi.mock('../context/useLoans', () => ({
    useLoans: () => ({
        loans: [],
        clients: [],
        recalculateLoan: vi.fn(),
        registerPayment: vi.fn(async () => ({ success: true })),
        togglePause: vi.fn(async () => ({ success: true }))
    })
}));

vi.mock('../context/useAuth', () => ({
    useAuth: () => ({
        token: 'token',
        fetchWithAuth: vi.fn()
    })
}));

vi.mock('../hooks/useLoanHealth', () => ({
    useLoanHealth: () => ({
        getLoanHealth: () => ({
            color: 'emerald',
            label: 'Saludable',
            description: 'Prestamo al dia'
        })
    })
}));

vi.mock('../components/PagareModal', () => ({
    default: () => null
}));

vi.mock('../components/PaymentScheduleTable', () => ({
    default: () => <div>Cronograma mock</div>
}));

vi.mock('../components/PaymentModal', () => ({
    default: ({ isOpen, onClose, payment }) => (
        isOpen && payment
            ? (
                <div>
                    <p>Modal {payment.id}</p>
                    <button onClick={onClose}>Cerrar modal</button>
                </div>
            )
            : null
    )
}));

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid="location-search">{location.search}</div>;
};

describe('LoanDetail payment deep-link behavior', () => {
    it('closes the payment modal on the first click and clears the payment query param', async () => {
        render(
            <MemoryRouter initialEntries={['/loans/loan-1?payment=pay-1']}>
                <Routes>
                    <Route
                        path="/loans/:id"
                        element={(
                            <>
                                <LoanDetail />
                                <LocationProbe />
                            </>
                        )}
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('Modal pay-1')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));

        await waitFor(() => {
            expect(screen.queryByText('Modal pay-1')).toBeNull();
            expect(screen.getByTestId('location-search').textContent).toBe('');
        });
    });
});
