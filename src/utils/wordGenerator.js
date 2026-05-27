import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getLoanInterestRate = (loan) => Number(loan?.interestRate ?? loan?.rate ?? 0);
const getLoanDurationMonths = (loan) => Number(loan?.durationMonths ?? loan?.term ?? 0);
const getAmount = (value) => Number(value ?? 0);
const getText = (value, fallback = 'No registrado') => {
    const text = String(value ?? '').trim();
    return text || fallback;
};
const getDateLabel = (value, fallback = 'Sin fecha') => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
        ? format(date, 'dd MMM yyyy', { locale: es })
        : fallback;
};

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

const buildScheduleTableRows = (loan) => {
    const payments = Array.isArray(loan?.payments) ? [...loan.payments] : [];
    return payments
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .map((payment, index) => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(String(index + 1))] }),
                new TableCell({ children: [new Paragraph(getDateLabel(payment?.dueDate))] }),
                new TableCell({ children: [new Paragraph(`$${getAmount(payment?.amount).toFixed(2)}`)] }),
                new TableCell({
                    children: [new Paragraph(payment?.status === 'Paid' ? 'Pagado' : payment?.status === 'Partial' ? 'Parcial' : 'Pendiente')]
                })
            ]
        }));
};

export const generateWordContract = async (loan, client) => {
    const interestRate = getLoanInterestRate(loan);
    const durationMonths = getLoanDurationMonths(loan);
    const clientName = getText(client?.name, 'Cliente');

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: 'CONTRATO DE PRESTAMO',
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Fecha: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({ text: 'Informacion del Cliente', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Nombre: ${clientName}`, bullet: { level: 0 } }),
                new Paragraph({ text: `ID: ${getText(client?.id, 'Sin ID')}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Email: ${getText(client?.email)}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Telefono: ${getText(client?.phone)}`, bullet: { level: 0 }, spacing: { after: 300 } }),
                new Paragraph({ text: 'Detalles del Prestamo', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Monto Prestado: $${getAmount(loan?.amount).toFixed(2)}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Tasa de Interes: ${(interestRate * 100).toFixed(2)}% (${getText(loan?.frequency, 'Sin frecuencia')})`, bullet: { level: 0 } }),
                new Paragraph({ text: `Duracion: ${durationMonths} meses`, bullet: { level: 0 } }),
                new Paragraph({ text: `Fecha de Inicio: ${getDateLabel(loan?.startDate)}`, bullet: { level: 0 }, spacing: { after: 300 } }),
                new Paragraph({ text: 'Terminos y Condiciones', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({
                    text: 'El prestatario se compromete a pagar al prestamista el monto total del prestamo mas los intereses devengados segun el cronograma de pagos adjunto. En caso de mora, se aplicaran penalidades adicionales segun la configuracion del credito y la ley vigente.',
                    spacing: { after: 400 }
                }),
                new Paragraph({ text: 'Cronograma de Pagos', heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: ['Cuota', 'Fecha', 'Monto', 'Estado'].map((text) => new TableCell({
                                children: [new Paragraph(text)],
                                width: { size: 25, type: WidthType.PERCENTAGE }
                            }))
                        }),
                        ...buildScheduleTableRows(loan)
                    ]
                }),
                new Paragraph({ text: '\n\n\n', spacing: { after: 400 } }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph('__________________________'),
                                        new Paragraph('Firma del Cliente')
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ text: '__________________________', alignment: AlignmentType.RIGHT }),
                                        new Paragraph({ text: 'Firma del Prestamista', alignment: AlignmentType.RIGHT })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `Contrato_${clientName.replace(/\s+/g, '_')}_${loan?.id || 'sin-id'}.docx`);
};

export const generateWordReceipt = async (payment, loan, client) => {
    const clientName = getText(client?.name, 'Cliente');

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: 'RECIBO DE PAGO',
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Recibo #: ${String(payment?.id || '').substring(0, 8)}`,
                    alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                    text: `Fecha: ${format(new Date(), 'dd MMM yyyy pp', { locale: es })}`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 300 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Recibimos de: ', bold: true }),
                        new TextRun(clientName)
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'La suma de: ', bold: true }),
                        new TextRun({ text: `$${getAmount(payment?.amount).toFixed(2)}`, size: 32, bold: true })
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Concepto: ', bold: true }),
                        new TextRun(`Pago de cuota del prestamo #${loan?.id || 'sin-id'}`)
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Vencimiento Original: ', bold: true }),
                        new TextRun(getDateLabel(payment?.dueDate))
                    ],
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: 'Gracias por su pago puntual.',
                    alignment: AlignmentType.CENTER,
                    italics: true,
                    spacing: { before: 400 }
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `Recibo_${payment?.id || 'sin-id'}_${clientName.replace(/\s+/g, '_')}.docx`);
};
