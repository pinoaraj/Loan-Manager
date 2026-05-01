export const generateWhatsAppLink = (phone, message) => {
    // Remove non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const generateEmailLink = (email, subject, body) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
};

export const getReceiptMessage = (clientName, amount, date) => {
    return `*COMPROBANTE DE PAGO*\n\nHola *${clientName}*,\n\nConfirmamos que hemos recibido satisfactoriamente su pago de *$${amount}* el día ${date}.\n\nSu saldo ha sido actualizado en el sistema. ¡Gracias por su puntualidad!`;
};

export const getReminderMessage = (clientName, amount, dueDate, type = 'upcoming') => {
    const formattedDate = new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    
    if (type === 'overdue') {
        return `*AVISO DE PAGO VENCIDO*\n\nHola *${clientName}*,\n\nLe informamos que su cuota de *$${amount}* con vencimiento el ${formattedDate} se encuentra *vencida*.\n\nPor favor, regularice su situación lo antes posible para evitar recargos adicionales. Si ya realizó el pago, por favor ignore este mensaje.`;
    }
    
    return `*RECORDATORIO DE PAGO*\n\nHola *${clientName}*,\n\nLe recordamos que su próxima cuota de *$${amount}* vence el día *${formattedDate}*.\n\nQuedamos a su disposición para cualquier consulta.`;
};
