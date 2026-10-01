import { compareStoredDates, parseStoredDate } from './dates';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '09:30';
const DEFAULT_ALARM_MINUTES = 24 * 60;

const pad = (value) => String(value).padStart(2, '0');

const toDateInstance = (value) => {
    return parseStoredDate(value);
};

const formatGoogleDate = (value, time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = toDateInstance(value);
    if (!date) {
        return '';
    }
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);

    return [
        eventDate.getFullYear(),
        pad(eventDate.getMonth() + 1),
        pad(eventDate.getDate())
    ].join('') + `T${pad(eventDate.getHours())}${pad(eventDate.getMinutes())}00`;
};

const formatUtcDateTime = (value, time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = toDateInstance(value);
    if (!date) {
        return '';
    }
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);

    return [
        eventDate.getUTCFullYear(),
        pad(eventDate.getUTCMonth() + 1),
        pad(eventDate.getUTCDate())
    ].join('') + `T${pad(eventDate.getUTCHours())}${pad(eventDate.getUTCMinutes())}${pad(eventDate.getUTCSeconds())}Z`;
};

const formatCurrentUtcStamp = () => {
    const now = new Date();
    return [
        now.getUTCFullYear(),
        pad(now.getUTCMonth() + 1),
        pad(now.getUTCDate())
    ].join('') + `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
};

const escapeIcsText = (value = '') => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const slugifyFilePart = (value = 'cliente') => String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cliente';

const downloadCalendarBlob = (content, fileName) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const createCalendarEvent = ({
    uid,
    title,
    details,
    date,
    startTime = DEFAULT_START_TIME,
    endTime = DEFAULT_END_TIME,
    alarmMinutes = DEFAULT_ALARM_MINUTES
}) => {
    const stamp = formatCurrentUtcStamp();
    const dtStart = formatUtcDateTime(date, startTime);
    const dtEnd = formatUtcDateTime(date, endTime);

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeIcsText(title)}`,
        `DESCRIPTION:${escapeIcsText(details)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(title)}`,
        `TRIGGER:-PT${alarmMinutes}M`,
        'END:VALARM',
        'END:VEVENT'
    ].join('\r\n');
};

const buildCalendarFile = (events) => [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Loan Manager//Calendario de Cobros//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
].join('\r\n');

export const generateGoogleCalendarLink = ({ title, details, date, startTime = DEFAULT_START_TIME, endTime = DEFAULT_END_TIME }) => {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        details,
        dates: `${formatGoogleDate(date, startTime)}/${formatGoogleDate(date, endTime)}`
    });

    return `${baseUrl}?${params.toString()}`;
};

export const getPaymentEventDetails = (clientName, amount, paymentNumber, totalPayments) => ({
    title: `Cobro ${paymentNumber}/${totalPayments} - ${clientName}`,
    details: [
        'Recordatorio de cobro de prestamo.',
        `Cliente: ${clientName}`,
        `Monto: $${Number(amount).toFixed(2)}`,
        `Cuota: ${paymentNumber} de ${totalPayments}`
    ].filter(Boolean).join('\n')
});

export const downloadPaymentReminder = (payment, clientName, options = {}) => {
    const paymentNumber = options.paymentNumber || payment.paymentNumber || 1;
    const totalPayments = options.totalPayments || payment.totalPayments || paymentNumber;
    const paymentAmount = payment.amount + (payment.lateFee || 0);
    const { title, details } = getPaymentEventDetails(
        clientName,
        paymentAmount,
        paymentNumber,
        totalPayments
    );

    const content = buildCalendarFile([
        createCalendarEvent({
            uid: `${options.loanId || 'loan'}-${payment.id || paymentNumber}@loan-manager`,
            title,
            details,
            date: payment.dueDate
        })
    ]);

    downloadCalendarBlob(content, `loan-manager-cobro-${slugifyFilePart(clientName)}-${paymentNumber}.ics`);
};

export const downloadLoanCalendar = (loan, client, options = {}) => {
    const sortedPayments = [...(loan?.payments || [])].sort((a, b) => compareStoredDates(a.dueDate, b.dueDate));
    if (sortedPayments.length === 0) {
        return false;
    }

    const events = sortedPayments.map((payment, index) => {
        const paymentAmount = payment.amount + (payment.lateFee || 0);
        const { title, details } = getPaymentEventDetails(
            client?.name || 'Cliente',
            paymentAmount,
            index + 1,
            sortedPayments.length
        );

        return createCalendarEvent({
            uid: `${loan.id}-${payment.id || index + 1}@loan-manager`,
            title,
            details,
            date: payment.dueDate
        });
    });

    const label = options.fileName || `loan-manager-cobros-${slugifyFilePart(client?.name || 'prestamo')}.ics`;
    downloadCalendarBlob(buildCalendarFile(events), label);
    return true;
};

export const downloadBulkLoanCalendars = (entries, fileName = 'loan-manager-cobros.ics') => {
    const events = entries.flatMap(({ loan, client }) => {
        const sortedPayments = [...(loan?.payments || [])].sort((a, b) => compareStoredDates(a.dueDate, b.dueDate));

        return sortedPayments.map((payment, index) => {
            const paymentAmount = payment.amount + (payment.lateFee || 0);
            const { title, details } = getPaymentEventDetails(
                client?.name || 'Cliente',
                paymentAmount,
                index + 1,
                sortedPayments.length
            );

            return createCalendarEvent({
                uid: `${loan.id}-${payment.id || index + 1}@loan-manager`,
                title,
                details,
                date: payment.dueDate
            });
        });
    });

    if (events.length === 0) {
        return false;
    }

    downloadCalendarBlob(buildCalendarFile(events), fileName);
    return true;
};

export const openGoogleCalendar = (payment, clientName, options = {}) => {
    const paymentNumber = options.paymentNumber || payment.paymentNumber || 'Pendiente';
    const totalPayments = options.totalPayments || payment.totalPayments || 'Total';
    const paymentAmount = payment.amount + (payment.lateFee || 0);
    const paymentDetails = getPaymentEventDetails(
        clientName,
        paymentAmount,
        paymentNumber,
        totalPayments
    );

    const link = generateGoogleCalendarLink({
        ...paymentDetails,
        date: payment.dueDate
    });

    window.open(link, '_blank');
};
