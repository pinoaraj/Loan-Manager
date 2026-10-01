export const formatCurrency = (value, options = {}) => {
    const {
        minimumFractionDigits = 0,
        maximumFractionDigits = 2
    } = options;

    return Number(value || 0).toLocaleString('es-CL', {
        minimumFractionDigits,
        maximumFractionDigits
    });
};
