import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { compareStoredDates, formatStoredDate } from './dates';

const COMPANY_NAME = 'Loan Manager';

const getLoanInterestRate = (loan) => Number(loan?.interestRate ?? loan?.rate ?? 0);
const getLoanDurationMonths = (loan) => Number(loan?.durationMonths ?? loan?.term ?? 0);
const getAmount = (value) => Number(value ?? 0);
const getText = (value, fallback = 'No registrado') => {
    const text = String(value ?? '').trim();
    return text || fallback;
};
const getDateLabel = (value, fallback = 'Sin fecha') => formatStoredDate(value, 'dd MMM yyyy', fallback);
const getFileSafeLabel = (value, fallback = 'documento') => String(value ?? fallback)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '') || fallback;
const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
};

const getScheduleRows = (loan) => {
    const payments = Array.isArray(loan?.payments) ? [...loan.payments] : [];
    return payments
        .sort((a, b) => compareStoredDates(a.dueDate, b.dueDate))
        .map((payment, index) => ([
            index + 1,
            getDateLabel(payment?.dueDate, 'Sin fecha'),
            `$${getAmount(payment?.amount).toFixed(2)}`,
            payment?.status === 'Paid' ? 'Pagado' : payment?.status === 'Partial' ? 'Parcial' : 'Pendiente'
        ]));
};

export const generateLoanContract = (loan, client) => {
    const doc = new jsPDF();
    const interestRate = getLoanInterestRate(loan);
    const durationMonths = getLoanDurationMonths(loan);
    const loanAmount = getAmount(loan?.amount);
    const clientName = getText(client?.name, 'Cliente');

    doc.setFontSize(22);
    doc.text('CONTRATO DE PRESTAMO', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Fecha: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`, 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Informacion del Cliente', 14, 45);
    doc.setFontSize(10);
    doc.text(`Nombre: ${clientName}`, 14, 55);
    doc.text(`RUT: ${getText(client?.rut, 'No registrado')}`, 14, 60);
    doc.text(`Email: ${getText(client?.email)}`, 14, 65);
    doc.text(`Telefono: ${getText(client?.phone)}`, 14, 70);

    doc.setFontSize(14);
    doc.text('Detalles del Prestamo', 14, 85);
    doc.setFontSize(10);
    doc.text(`Monto Prestado: $${loanAmount.toFixed(2)}`, 14, 95);
    doc.text(`Tasa de Interes: ${(interestRate * 100).toFixed(2)}% (${getText(loan?.frequency, 'Sin frecuencia')})`, 14, 100);
    doc.text(`Duracion: ${durationMonths} meses`, 14, 105);
    doc.text(`Fecha de Inicio: ${getDateLabel(loan?.startDate)}`, 14, 110);

    doc.setFontSize(12);
    doc.text('Terminos y Condiciones', 14, 125);
    doc.setFontSize(9);
    const terms = 'El prestatario se compromete a pagar al prestamista el monto total del prestamo mas los intereses devengados segun el cronograma de pagos adjunto. En caso de mora, se aplicaran penalidades adicionales segun la configuracion del credito y la legislacion vigente.';
    doc.splitTextToSize(terms, 180).forEach((line, index) => {
        doc.text(line, 14, 135 + (index * 5));
    });

    autoTable(doc, {
        startY: 155,
        head: [['Cuota', 'Vencimiento', 'Monto', 'Estado']],
        body: getScheduleRows(loan),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc.lastAutoTable?.finalY || 170) + 40;
    doc.line(20, finalY, 80, finalY);
    doc.line(130, finalY, 190, finalY);
    doc.text('Firma del Cliente', 30, finalY + 10);
    doc.text('Firma del Prestamista', 140, finalY + 10);

    const blob = doc.output('blob');
    downloadBlob(blob, `Contrato_${getFileSafeLabel(clientName, 'Cliente')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateReceipt = (payment, loan, client) => {
    const doc = new jsPDF();
    const amount = getAmount(payment?.amount);
    const clientName = getText(client?.name, 'Cliente');

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text('RECIBO DE PAGO', 105, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Recibo de Pago', 14, 60);
    doc.text(`Fecha: ${format(new Date(), 'dd MMM yyyy pp', { locale: es })}`, 14, 70);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 75, 196, 75);

    doc.setFontSize(12);
    doc.text('Recibimos de:', 14, 90);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(clientName, 14, 100);
    doc.setFont(undefined, 'normal');

    doc.setFontSize(12);
    doc.text('La suma de:', 14, 120);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`$${amount.toFixed(2)}`, 14, 130);
    doc.setFont(undefined, 'normal');

    doc.setFontSize(12);
    doc.text('Concepto:', 14, 150);
    doc.text('Pago correspondiente a cuota programada', 14, 160);
    doc.text(`Vencimiento Original: ${getDateLabel(payment?.dueDate)}`, 14, 170);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Gracias por su pago puntual.', 105, 280, { align: 'center' });
    doc.text(COMPANY_NAME, 105, 285, { align: 'center' });

    const blob = doc.output('blob');
    downloadBlob(blob, `Recibo_${getFileSafeLabel(clientName, 'Cliente')}_${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
};
