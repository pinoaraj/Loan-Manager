const { differenceInDays, addDays, isAfter, startOfDay } = require('date-fns');

/**
 * Checks and applies late fees for a given loan and its payments.
 * @param {Object} loan - The loan object including payments.
 * @param {Object} prisma - The prisma client instance.
 * @returns {Promise<Object>} - The updated loan object.
 */
const checkAndApplyLateFees = async (loan, prisma) => {
    const today = startOfDay(new Date());
    const { graceDays, lateFeeType, lateFeeValue } = loan;
    let updatesMade = false;

    // We only check pending payments or already overdue ones (to update fee if needed)
    // Actually, usually fee is applied once. Let's assume we apply it if it's 0.

    // Process payments
    for (const payment of loan.payments) {
        if (payment.status === 'Paid') continue;

        const dueDate = startOfDay(new Date(payment.dueDate));
        const daysOverdue = differenceInDays(today, dueDate);

        // Check if grace period is exceeded
        // Example: Due Jan 1. Grace 3 days.
        // Jan 2 (1 day diff) -> OK
        // Jan 4 (3 days diff) -> OK
        // Jan 5 (4 days diff) -> Late
        if (daysOverdue > graceDays) {
            let newStatus = 'Overdue';
            let newLateFee = payment.lateFee;

            // Calculate Fee if not already applied (or maybe we update it dynamic? let's stick to apply once if 0)
            if (payment.lateFee === 0) {
                if (lateFeeType === 'Percent') {
                    // e.g. 0.05 * amount
                    newLateFee = payment.amount * lateFeeValue;
                } else {
                    // Fixed amount
                    newLateFee = lateFeeValue;
                }
            }

            // Only update if something changed
            if (payment.status !== newStatus || payment.lateFee !== newLateFee) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: newStatus,
                        lateFee: newLateFee
                    }
                });
                updatesMade = true;
            }
        }
    }

    if (updatesMade) {
        // Return fresh data
        return await prisma.loan.findUnique({
            where: { id: loan.id },
            include: { client: true, payments: true }
        });
    }

    return loan;
};

module.exports = { checkAndApplyLateFees };
