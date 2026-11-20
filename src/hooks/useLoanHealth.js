import { differenceInDays, startOfDay } from 'date-fns';
import { parseStoredDate } from '../utils/dates';

export const useLoanHealth = () => {
    const getLoanHealth = (loan) => {
        // 1. Paused check
        if (loan.isPaused) {
            return {
                status: 'PAUSADA',
                label: 'DEUDA PAUSADA',
                color: 'slate', // bg-slate-100 text-slate-700
                description: 'La deuda está pausada administrativamente.'
            };
        }

        // 2. Paid check
        if (loan.status === 'Paid') {
            return {
                status: 'PAGADO',
                label: 'PAGADO',
                color: 'emerald',
                description: 'El préstamo ha sido pagado en su totalidad.'
            };
        }

        // 3. Calculate delays
        const today = startOfDay(new Date());
        let maxDaysLate = 0;
        let overdueCount = 0;

        loan.payments.forEach(p => {
            if (p.status !== 'Paid') {
                const dueDate = parseStoredDate(p.dueDate);
                if (!dueDate) {
                    return;
                }
                if (dueDate < today) {
                    const daysLate = differenceInDays(today, dueDate);
                    if (daysLate > maxDaysLate) maxDaysLate = daysLate;
                    overdueCount++;
                }
            }
        });

        // 4. Determine Health
        if (overdueCount === 0) {
            return {
                status: 'AL_DIA',
                label: 'AL DÍA',
                color: 'emerald', // Using emerald/green for good standing
                description: 'El cliente está al día con sus pagos.'
            };
        } else if (maxDaysLate >= 30) {
            // Moroso rule: 30+ days late (User specified 30-360)
            return {
                status: 'MOROSO',
                label: 'MOROSO',
                color: 'rose', // Red for serious default
                description: `Cliente moroso con ${maxDaysLate} días de atraso.`
            };
        } else {
            // Atrasado rule: 1-29 days late
            return {
                status: 'ATRASADO',
                label: 'ATRASADO',
                color: 'amber', // Yellow/Orange for warning
                description: `Cliente atrasado con ${maxDaysLate} días de atraso.`
            };
        }
    };

    return { getLoanHealth };
};
