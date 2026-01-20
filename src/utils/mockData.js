import { addMonths, format } from 'date-fns';

export const generateMockData = () => {
    const clients = [
        { id: '1', name: 'Juan Perez', email: 'juan@example.com', phone: '555-0101', address: 'Calle 123' },
        { id: '2', name: 'Maria Garcia', email: 'maria@example.com', phone: '555-0102', address: 'Av. Libertador 456' },
        { id: '3', name: 'Carlos Lopez', email: 'carlos@example.com', phone: '555-0103', address: 'Barrio Norte 789' },
    ];

    const loans = [
        {
            id: 'L1',
            clientId: '1',
            amount: 5000,
            interestRate: 0.10,
            startDate: format(addMonths(new Date(), -2), 'yyyy-MM-dd'),
            durationMonths: 6,
            status: 'Active',
        },
        {
            id: 'L2',
            clientId: '2',
            amount: 10000,
            interestRate: 0.15,
            startDate: format(addMonths(new Date(), -1), 'yyyy-MM-dd'),
            durationMonths: 12,
            status: 'Active',
        },
        {
            id: 'L3',
            clientId: '3',
            amount: 2000,
            interestRate: 0.05,
            startDate: format(new Date(), 'yyyy-MM-dd'),
            durationMonths: 3,
            status: 'Active',
        },
    ];

    return { clients, loans };
};
