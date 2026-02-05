// import { format } from 'date-fns';

/**
 * Generates a Google Calendar Event URL
 * @param {Object} params
 * @param {string} params.title - Event title
 * @param {string} params.details - Event description
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.startTime - Start time in HH:mm format (default 09:00)
 * @param {string} params.endTime - End time in HH:mm format (default 10:00)
 */
export const generateGoogleCalendarLink = ({ title, details, date, startTime = '09:00', endTime = '10:00' }) => {
    const baseUrl = 'https://calendar.google.com/calendar/render';

    // Format dates to YYYYMMDDTHHmmSSZ
    // Note: We'll imply local time by not adding Z, or standard text format.
    // Simpler approach: dates as YYYYMMDDTHHmm00
    const start = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
    const end = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        details: details,
        dates: `${start}/${end}`,
        // location: '', // Optional
    });

    return `${baseUrl}?${params.toString()}`;
};

/**
 * Generates a standard payment reminder title and description
 */
export const getPaymentEventDetails = (clientName, amount, paymentNumber, totalPayments) => {
    return {
        title: `Pago ${paymentNumber}/${totalPayments} - ${clientName}`,
        details: `Recordatorio de pago de préstamo.\nCliente: ${clientName}\nMonto: $${amount}\nCuota: ${paymentNumber} de ${totalPayments}`
    };
};

/**
 * Opens a Google Calendar event for a specific payment
 * Used by PaymentScheduleTable component
 */
export const openGoogleCalendar = (payment, clientName) => {
    const paymentDetails = getPaymentEventDetails(
        clientName,
        payment.amount,
        'Pendiente', // We don't have payment number in this context
        'Total'
    );

    const link = generateGoogleCalendarLink({
        ...paymentDetails,
        date: payment.dueDate
    });

    window.open(link, '_blank');
};

/**
 * Downloads/opens a calendar reminder for a payment alert
 * Used by Collections component
 */
export const downloadCalendarReminder = (payment, clientName) => {
    const paymentDetails = getPaymentEventDetails(
        clientName,
        payment.amount,
        payment.paymentNumber || 'Pendiente',
        payment.totalPayments || 'Total'
    );

    const link = generateGoogleCalendarLink({
        ...paymentDetails,
        date: payment.dueDate
    });

    window.open(link, '_blank');
};
