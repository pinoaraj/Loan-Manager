/**
 * Validates client data for creation
 */
const validateClient = (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }
    // Optional: Email validations, etc.
    return errors;
};

/**
 * Validates loan data for creation
 */
const validateLoan = (data) => {
    const errors = [];
    if (!data.clientId) errors.push('ClientId is required');
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
        errors.push('Amount must be a positive number');
    }
    if (!data.durationMonths || isNaN(parseInt(data.durationMonths)) || parseInt(data.durationMonths) < 1) {
        errors.push('Duration must be at least 1 month');
    }
    if (data.interestRate === undefined || isNaN(parseFloat(data.interestRate)) || parseFloat(data.interestRate) < 0) {
        errors.push('Interest rate must be non-negative');
    }
    return errors;
};

module.exports = { validateClient, validateLoan };
