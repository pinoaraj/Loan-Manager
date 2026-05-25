import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COMPANY_NAME = "Loan Manager";
const COMPANY_CONTACT = "contacto@loanmanager.com";

const getLoanInterestRate = (loan) => Number(loan.interestRate ?? loan.rate ?? 0);
const getLoanDurationMonths = (loan) => loan.durationMonths ?? loan.term ?? 0;

export const generateLoanContract = (loan, client) => {
    const doc = new jsPDF();
    const interestRate = getLoanInterestRate(loan);
    const durationMonths = getLoanDurationMonths(loan);

    // Header
    doc.setFontSize(22);
    doc.text("CONTRATO DE PRÉSTAMO", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Fecha: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`, 105, 30, { align: "center" });

    // Client Info
    doc.setFontSize(14);
    doc.text("Información del Cliente", 14, 45);
    doc.setFontSize(10);
    doc.text(`Nombre: ${client.name}`, 14, 55);
    doc.text(`ID: ${client.id}`, 14, 60);
    doc.text(`Email: ${client.email}`, 14, 65);
    doc.text(`Teléfono: ${client.phone}`, 14, 70);

    // Loan Details
    doc.setFontSize(14);
    doc.text("Detalles del Préstamo", 14, 85);
    doc.setFontSize(10);
    doc.text(`Monto Prestado: $${loan.amount.toFixed(2)}`, 14, 95);
    doc.text(`Tasa de Interés: ${(interestRate * 100).toFixed(1)}% (${loan.frequency})`, 14, 100);
    doc.text(`Duración: ${durationMonths} meses`, 14, 105);
    doc.text(`Fecha de Inicio: ${format(new Date(loan.startDate), 'dd MMM yyyy')}`, 14, 110);

    // Terms
    doc.setFontSize(12);
    doc.text("Términos y Condiciones", 14, 125);
    doc.setFontSize(9);
    const terms = "El Prestatario se compromete a pagar al Prestamista el monto total del préstamo más los intereses devengados según el cronograma de pagos adjunto. En caso de mora, se aplicarán penalidades adicionales según lo estipulado por la ley vigente.";
    doc.splitTextToSize(terms, 180).forEach((line, i) => {
        doc.text(line, 14, 135 + (i * 5));
    });

    // Schedule Table
    doc.autoTable({
        startY: 155,
        head: [['Cuota', 'Vencimiento', 'Monto', 'Estado']],
        body: loan.payments ? loan.payments.map((p, i) => [
            i + 1,
            format(new Date(p.dueDate), 'dd/MM/yyyy'),
            `$${p.amount.toFixed(2)}`,
            p.status === 'Paid' ? 'Pagado' : 'Pendiente'
        ]) : [],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
    });

    // Signatures
    const finalY = doc.lastAutoTable.finalY + 40;
    doc.line(20, finalY, 80, finalY); // Left line
    doc.line(130, finalY, 190, finalY); // Right line
    doc.text("Firma del Cliente", 30, finalY + 10);
    doc.text("Firma del Prestamista", 140, finalY + 10);

    doc.save(`Contrato_${client.name.replace(/\s+/g, '_')}_${loan.id}.pdf`);
};

export const generateReceipt = (payment, loan, client) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text("RECIBO DE PAGO", 105, 25, { align: "center" });

    // Payment Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Recibo #: ${payment.id.substring(0, 8)}`, 14, 60);
    doc.text(`Fecha: ${format(new Date(), 'dd MMM yyyy pp', { locale: es })}`, 14, 70);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 75, 196, 75);

    // Details
    doc.setFontSize(12);
    doc.text("Recibimos de:", 14, 90);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(client.name, 14, 100);
    doc.setFont(undefined, 'normal');

    doc.setFontSize(12);
    doc.text("La suma de:", 14, 120);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`$${payment.amount.toFixed(2)}`, 14, 130);
    doc.setFont(undefined, 'normal');

    doc.setFontSize(12);
    doc.text("Concepto:", 14, 150);
    doc.text(`Pago de cuota del préstamo #${loan.id}`, 14, 160);
    doc.text(`Vencimiento Original: ${format(new Date(payment.dueDate), 'dd MMM yyyy')}`, 14, 170);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Gracias por su pago puntual.", 105, 280, { align: "center" });
    doc.text(COMPANY_NAME, 105, 285, { align: "center" });

    doc.save(`Recibo_${payment.id}_${client.name.replace(/\s+/g, '_')}.pdf`);
};
