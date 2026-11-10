/**
 * Amortization Engine (Frontend Version)
 * Mirror of backend logic for immediate preview.
 */

const normalizeFrequency = (frequency = 'monthly') => {
    const normalized = String(frequency).trim().toLowerCase();
    return normalized === 'biweekly' ? 'bi-weekly' : normalized;
};

// Las fechas "date only" llegan como medianoche UTC y en Chile se ven como el
// dia anterior. Se reancla a mediodia local para que el dia calendario no se
// corra al serializar, igual que hace la app movil.
const toLocalNoon = (value) => {
    if (value instanceof Date) {
        const copy = new Date(value.getTime());
        copy.setHours(12, 0, 0, 0);
        return copy;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? '').trim());
    const parsed = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0)
        : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    parsed.setHours(12, 0, 0, 0);
    return parsed;
};

// `setMonth` desborda en los dias 29-31 (31 de enero + 1 mes terminaba el 3 de
// marzo). Se ancla al ultimo dia del mes destino.
const addMonthsClamped = (start, months) => {
    const year = start.getFullYear();
    const month = start.getMonth() + months;
    const day = start.getDate();
    const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();

    return new Date(year, month, Math.min(day, lastDayOfTargetMonth), 12, 0, 0, 0);
};

const buildMonthlySchedule = (principal, monthlyRate, durationMonths, startDate, loanType = 'Fixed') => {
    const schedule = [];
    const start = toLocalNoon(startDate);

    if (loanType === 'Fixed') {
        let paymentAmount;
        if (monthlyRate === 0) {
            paymentAmount = principal / durationMonths;
        } else {
            paymentAmount = (principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / (Math.pow(1 + monthlyRate, durationMonths) - 1);
        }

        let remainingPrincipal = principal;

        for (let i = 1; i <= durationMonths; i++) {
            const interest = remainingPrincipal * monthlyRate;
            const principalPart = paymentAmount - interest;
            remainingPrincipal -= principalPart;

            const dueDate = addMonthsClamped(start, i);

            schedule.push({
                installment: i,
                dueDate,
                amount: paymentAmount,
                principal: principalPart,
                interest,
                fees: 0,
                status: 'Pending'
            });
        }
    } else {
        const totalInterest = principal * monthlyRate * durationMonths;
        const totalPayment = principal + totalInterest;
        const paymentAmount = totalPayment / durationMonths;
        const principalPart = principal / durationMonths;
        const interestPart = totalInterest / durationMonths;

        for (let i = 1; i <= durationMonths; i++) {
            const dueDate = addMonthsClamped(start, i);

            schedule.push({
                installment: i,
                dueDate,
                amount: paymentAmount,
                principal: principalPart,
                interest: interestPart,
                fees: 0,
                status: 'Pending'
            });
        }
    }

    return schedule;
};

const splitMonthlySchedule = (monthlySchedule, startDate, partsPerMonth, dayStep) => {
    const start = toLocalNoon(startDate);
    const schedule = [];

    monthlySchedule.forEach((payment, monthIndex) => {
        for (let part = 1; part <= partsPerMonth; part++) {
            const installment = (monthIndex * partsPerMonth) + part;
            const dueDate = new Date(start);
            dueDate.setDate(dueDate.getDate() + (installment * dayStep));

            schedule.push({
                installment,
                dueDate,
                amount: payment.amount / partsPerMonth,
                principal: payment.principal / partsPerMonth,
                interest: payment.interest / partsPerMonth,
                fees: payment.fees || 0,
                status: payment.status || 'Pending'
            });
        }
    });

    return schedule;
};

export const calculateAmortization = (principal, monthlyRate, durationMonths, startDate, frequency = 'monthly', loanType = 'Fixed') => {
    const normalizedFrequency = normalizeFrequency(frequency);
    const monthlySchedule = buildMonthlySchedule(principal, monthlyRate, durationMonths, startDate, loanType);

    switch (normalizedFrequency) {
        case 'weekly':
            return splitMonthlySchedule(monthlySchedule, startDate, 4, 7);
        case 'bi-weekly':
            return splitMonthlySchedule(monthlySchedule, startDate, 2, 14);
        case 'monthly':
        default:
            return monthlySchedule;
    }
};
