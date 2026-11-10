import { toStoredLocaleDate } from './dates';

export const normalizePhoneNumber = (phone = '') => String(phone).replace(/\D/g, '');

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const hasPhoneNumber = (phone = '') => normalizePhoneNumber(phone).length > 0;

export const generateWhatsAppLink = (phone, message) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone) {
        return '';
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const generateMailtoLink = (email, subject, body) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
};

export const generateEmailLink = (email, subject, body) => {
    const mailtoUrl = generateMailtoLink(email, subject, body);
    const gmailComposeUrl = `https://mail.google.com/mail/?extsrc=mailto&url=${encodeURIComponent(mailtoUrl)}`;
    return `https://accounts.google.com/AccountChooser?service=mail&continue=${encodeURIComponent(gmailComposeUrl)}`;
};

export const openExternalLink = async (url) => {
    if (!url) {
        return false;
    }

    const isBrowserUrl = /^https?:/i.test(url);

    try {
        if (typeof window !== 'undefined' && typeof window.require === 'function') {
            const electron = window.require('electron');
            if (electron?.shell?.openExternal) {
                await electron.shell.openExternal(url);
                return true;
            }
        }
    } catch (error) {
        console.error('Falling back to browser-based external navigation:', error);
    }

    if (typeof window !== 'undefined') {
        if (isBrowserUrl) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = url;
        }
        return true;
    }

    return false;
};

export const getReceiptMessage = (clientName, amount, date) => {
    return `*COMPROBANTE DE PAGO*\n\nHola *${clientName}*,\n\nConfirmamos que hemos recibido satisfactoriamente su pago de *$${formatCurrency(amount)}* el dia ${date}.\n\nSu saldo ha sido actualizado en el sistema. Gracias por su puntualidad.`;
};

export const getReminderMessage = (clientName, amount, dueDate, type = 'upcoming', context = {}) => {
    const formattedDate = toStoredLocaleDate(dueDate, 'es-ES', { day: 'numeric', month: 'long' }, 'sin fecha');
    const paymentContext = context.paymentNumber && context.totalPayments
        ? `\nCuota: *${context.paymentNumber} de ${context.totalPayments}*`
        : '';

    if (type === 'overdue') {
        return `*AVISO DE PAGO VENCIDO*\n\nHola *${clientName}*,\n\nLe informamos que su cuota de *$${formatCurrency(amount)}* con vencimiento el ${formattedDate} se encuentra *vencida*.${paymentContext}\n\nPor favor, regularice su situacion lo antes posible para evitar recargos adicionales. Si ya realizo el pago, por favor ignore este mensaje.`;
    }

    return `*RECORDATORIO DE PAGO*\n\nHola *${clientName}*,\n\nLe recordamos que su proxima cuota de *$${formatCurrency(amount)}* vence el dia *${formattedDate}*.${paymentContext}\n\nQuedamos a su disposicion para cualquier consulta.`;
};
