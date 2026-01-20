import { format, parseISO, addHours } from 'date-fns';

/**
 * Generates an .ics file content and triggers download
 * @param {Object} payment - The payment object
 * @param {string} clientName - The name of the client
 */
export const downloadCalendarReminder = (payment, clientName) => {
    const dueDate = typeof payment.dueDate === 'string' ? parseISO(payment.dueDate) : payment.dueDate;

    // Set event to 9:00 AM on the due date
    const start = new Date(dueDate);
    start.setHours(9, 0, 0);
    const end = addHours(start, 1);

    const formatDate = (date) => {
        return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };

    const description = `Recordatorio de pago para el préstamo de ${clientName}.\n` +
        `Monto: $${payment.amount.toLocaleString()}\n` +
        `Estado: ${payment.status}`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Loan Manager//ES',
        'BEGIN:VEVENT',
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:Pago de Préstamo - ${clientName}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT1D', // 1 day before
        'ACTION:DISPLAY',
        'DESCRIPTION:Recordatorio de pago mañana',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `pago_${clientName.replace(/\s+/g, '_')}_${format(dueDate, 'yyyyMMdd')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Opens a Google Calendar event creation tab
 * @param {Object} payment - The payment object
 * @param {string} clientName - The name of the client
 */
export const openGoogleCalendar = (payment, clientName) => {
    const dueDate = typeof payment.dueDate === 'string' ? parseISO(payment.dueDate) : payment.dueDate;

    // Set event to 9:00 AM on the due date
    const start = new Date(dueDate);
    start.setHours(9, 0, 0);
    const end = addHours(start, 1);

    const formatDate = (date) => format(date, "yyyyMMdd'T'HHmmss");

    const title = `Pago de Préstamo - ${clientName}`;
    const desc = `Recordatorio de pago.\nMonto: $${payment.amount.toLocaleString()}\nEstado: ${payment.status}\n\nGenerado por Loan Manager`;

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title);
    url.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.append('details', desc);
    url.searchParams.append('trp', 'false'); // Busy status

    window.open(url.toString(), '_blank');
};
