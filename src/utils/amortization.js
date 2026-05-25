/**
 * Amortization Engine (Frontend Version)
 * Mirror of backend logic for immediate preview.
 */

const normalizeFrequency = (frequency = 'monthly') => {
    const normalized = String(frequency).trim().toLowerCase();
    return normalized === 'biweekly' ? 'bi-weekly' : normalized;
};

const buildMonthlySchedule = (principal, monthlyRate, durationMonths, startDate, loanType = 'Fixed') => {
    const schedule = [];
    const start = new Date(startDate);

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

            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + i);

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
            const dueDate = new Date(start);
            dueDate.setMonth(dueDate.getMonth() + i);

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
    const start = new Date(startDate);
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
