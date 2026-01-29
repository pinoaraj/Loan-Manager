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

    // annualRate here is actually the MONTHLY rate (e.g., 0.10 = 10% monthly)
    // We need to convert it to the appropriate period rate based on frequency
    const monthlyRate = annualRate;

    switch (frequency) {
        case 'weekly':
            periods = Math.round(durationMonths * (52 / 12)); // ~4.33 weeks per month
            periodRate = monthlyRate / (52 / 12); // Divide monthly rate by ~4.33
            incrementFn = (date, i) => {
                const d = new Date(date);
                d.setDate(d.getDate() + (i * 7));
                return d;
            };
            break;
        case 'bi-weekly':
            periods = Math.round(durationMonths * (26 / 12)); // ~2.17 bi-weeks per month
            periodRate = monthlyRate / (26 / 12); // Divide monthly rate by ~2.17
            incrementFn = (date, i) => {
                const d = new Date(date);
                d.setDate(d.getDate() + (i * 14));
                return d;
            };
            break;
        case 'monthly':
        default:
            periods = durationMonths;
            periodRate = monthlyRate; // No conversion needed
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
        // Simple Interest - use periodRate for consistency
        const totalInterest = principal * periodRate * periods;
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
