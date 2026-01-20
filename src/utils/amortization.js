/**
 * Amortization Engine (Frontend Version)
 * Mirror of backend logic for immediate preview.
 */

export const calculateAmortization = (principal, annualRate, durationMonths, startDate, frequency = 'monthly', loanType = 'Fixed') => {
    const schedule = [];
    const start = new Date(startDate);

    // Adjust frequency and calculate periodic values
    let periods;
    let periodRate;
    let incrementFn;

    switch (frequency) {
        case 'weekly':
            periods = Math.round(durationMonths * (52 / 12));
            periodRate = annualRate; // Use rate per period
            incrementFn = (date, i) => {
                const d = new Date(date);
                d.setDate(d.getDate() + (i * 7));
                return d;
            };
            break;
        case 'bi-weekly':
            periods = Math.round(durationMonths * (26 / 12));
            periodRate = annualRate; // Use rate per period
            incrementFn = (date, i) => {
                const d = new Date(date);
                d.setDate(d.getDate() + (i * 14));
                return d;
            };
            break;
        case 'monthly':
        default:
            periods = durationMonths;
            periodRate = annualRate; // Use rate per period
            incrementFn = (date, i) => {
                const d = new Date(date);
                d.setMonth(d.getMonth() + i);
                return d;
            };
            break;
    }

    if (loanType === 'Fixed') {
        // French Amortization (Fixed Payment)
        let pmt;
        if (periodRate === 0) {
            pmt = principal / periods;
        } else {
            pmt = (principal * periodRate * Math.pow(1 + periodRate, periods)) / (Math.pow(1 + periodRate, periods) - 1);
        }

        let remainingPrincipal = principal;

        for (let i = 1; i <= periods; i++) {
            const interest = remainingPrincipal * periodRate;
            const principalPart = pmt - interest;
            remainingPrincipal -= principalPart;

            schedule.push({
                installment: i,
                dueDate: incrementFn(start, i),
                amount: pmt,
                principal: principalPart,
                interest: interest,
                fees: 0,
                status: 'Pending'
            });
        }
    } else {
        // Simple Interest
        const totalInterest = principal * annualRate * periods;
        const totalPayment = principal + totalInterest;
        const periodPayment = totalPayment / periods;
        const periodPrincipal = principal / periods;
        const periodInterest = totalInterest / periods;

        for (let i = 1; i <= periods; i++) {
            schedule.push({
                installment: i,
                dueDate: incrementFn(start, i),
                amount: periodPayment,
                principal: periodPrincipal,
                interest: periodInterest,
                fees: 0,
                status: 'Pending'
            });
        }
    }

    return schedule;
};
