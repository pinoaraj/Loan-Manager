export const normalizePhoneNumber = (phone = '') => String(phone).replace(/\D/g, '');

export const hasPhoneNumber = (phone = '') => normalizePhoneNumber(phone).length > 0;

export const generateWhatsAppLink = (phone, message) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone) {
        return '';
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const generateEmailLink = (email, subject, body) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
};

export const getReceiptMessage = (clientName, amount, date) => {
    return `*COMPROBANTE DE PAGO*\n\nHola *${clientName}*,\n\nConfirmamos que hemos recibido satisfactoriamente su pago de *$${amount}* el dia ${date}.\n\nSu saldo ha sido actualizado en el sistema. Gracias por su puntualidad.`;
};

export const getReminderMessage = (clientName, amount, dueDate, type = 'upcoming', context = {}) => {
    const formattedDate = new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const paymentContext = context.paymentNumber && context.totalPayments
        ? `\nCuota: *${context.paymentNumber} de ${context.totalPayments}*`
        : '';
    const loanContext = context.loanId
        ? `\nPrestamo: *#${String(context.loanId).slice(-6)}*`
        : '';

    if (type === 'overdue') {
        return `*AVISO DE PAGO VENCIDO*\n\nHola *${clientName}*,\n\nLe informamos que su cuota de *$${amount}* con vencimiento el ${formattedDate} se encuentra *vencida*.${paymentContext}${loanContext}\n\nPor favor, regularice su situacion lo antes posible para evitar recargos adicionales. Si ya realizo el pago, por favor ignore este mensaje.`;
    }

    return `*RECORDATORIO DE PAGO*\n\nHola *${clientName}*,\n\nLe recordamos que su proxima cuota de *$${amount}* vence el dia *${formattedDate}*.${paymentContext}${loanContext}\n\nQuedamos a su disposicion para cualquier consulta.`;
};
