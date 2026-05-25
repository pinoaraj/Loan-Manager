import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoanProvider, useLoans } from '../LoanContext';

// Mock fetch
globalThis.fetch = vi.fn();

// Mock AuthContext
vi.mock('../AuthContext', () => ({
    useAuth: () => ({ token: 'mock-token' })
}));

// Helper to create wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            <LoanProvider>{children}</LoanProvider>
        </QueryClientProvider>
    );
};

describe('LoanContext - addClient', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    it('should create client successfully with complete data', async () => {
        const mockClient = {
            id: 'test-123',
            name: 'Test Cliente',
            email: 'test@example.com',
            phone: '1234567890',
            address: 'Test Address'
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockClient
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        const response = await result.current.addClient({
            name: 'Test Cliente',
            email: 'test@example.com',
            phone: '1234567890',
            address: 'Test Address'
        });

        expect(response).toEqual({ success: true, data: mockClient });
        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/clients',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token'
                })
            })
        );
    });

    it('should create client successfully with optional fields empty', async () => {
        const mockClient = {
            id: 'test-456',
            name: 'Test Cliente Minimal',
            email: '',
            phone: '',
            address: ''
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockClient
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        const response = await result.current.addClient({
            name: 'Test Cliente Minimal',
            email: '',
            phone: '',
            address: ''
        });

        expect(response).toEqual({ success: true, data: mockClient });
    });

    it('should throw error when server returns 400 Bad Request', async () => {
        const errorResponse = {
            error: 'Validation Error',
            details: [{ path: 'name', message: 'El nombre es obligatorio' }]
        };

        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => errorResponse
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        await expect(
            result.current.addClient({ name: '', email: '', phone: '', address: '' })
        ).rejects.toThrow('Validation Error');
    });

    it('should throw error when server returns 500 Internal Server Error', async () => {
        const errorResponse = {
            error: 'Internal Server Error'
        };

        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => errorResponse
        });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        await expect(
            result.current.addClient({ name: 'Test', email: '', phone: '', address: '' })
        ).rejects.toThrow('Internal Server Error');
    });

    it('should throw error when network fails', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        await expect(
            result.current.addClient({ name: 'Test', email: '', phone: '', address: '' })
        ).rejects.toThrow('Network error');
    });

    it('should invalidate queries after successful client creation', async () => {
        const mockClient = {
            id: 'test-789',
            name: 'Test Cliente',
            email: 'test@example.com',
            phone: '1234567890',
            address: 'Test Address'
        };

        // Mock both the POST and GET requests
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockClient
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [mockClient], meta: { total: 1 } })
            });

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLoans(), { wrapper });

        await result.current.addClient({
            name: 'Test Cliente',
            email: 'test@example.com',
            phone: '1234567890',
            address: 'Test Address'
        });

        // Wait for the query to be invalidated and refetched
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});
