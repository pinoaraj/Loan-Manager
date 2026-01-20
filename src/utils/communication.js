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

export const getReminderMessage = (clientName, amount, dueDate, type = 'upcoming') => {
    if (type === 'overdue') {
        return `Hola ${clientName}, le recordamos que su pago de $${amount} venció el ${dueDate}. Por favor, regularice su situación a la brevedad.`;
    }
    return `Hola ${clientName}, le recordamos su próximo pago de $${amount} con vencimiento el ${dueDate}.`;
};

export const getReceiptMessage = (clientName, amount, date) => {
    return `Hola ${clientName}, hemos recibido su pago de $${amount} el día ${date}. ¡Gracias!`;
};
