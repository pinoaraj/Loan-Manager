import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getLoanInterestRate = (loan) => Number(loan.interestRate ?? loan.rate ?? 0);
const getLoanDurationMonths = (loan) => loan.durationMonths ?? loan.term ?? 0;

const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const generateWordContract = async (loan, client) => {
    const interestRate = getLoanInterestRate(loan);
    const durationMonths = getLoanDurationMonths(loan);

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "CONTRATO DE PRESTAMO",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Fecha: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({ text: "Informacion del Cliente", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Nombre: ${client.name}`, bullet: { level: 0 } }),
                new Paragraph({ text: `ID: ${client.id}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Email: ${client.email}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Telefono: ${client.phone}`, bullet: { level: 0 }, spacing: { after: 300 } }),
                new Paragraph({ text: "Detalles del Prestamo", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Monto Prestado: $${loan.amount.toFixed(2)}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Tasa de Interes: ${(interestRate * 100).toFixed(1)}% (${loan.frequency})`, bullet: { level: 0 } }),
                new Paragraph({ text: `Duracion: ${durationMonths} meses`, bullet: { level: 0 } }),
                new Paragraph({ text: `Fecha de Inicio: ${format(new Date(loan.startDate), 'dd MMM yyyy')}`, bullet: { level: 0 }, spacing: { after: 300 } }),
                new Paragraph({ text: "Terminos y Condiciones", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({
                    text: "El Prestatario se compromete a pagar al Prestamista el monto total del prestamo mas los intereses devengados segun el cronograma de pagos adjunto. En caso de mora, se aplicaran penalidades adicionales segun lo estipulado por la ley vigente.",
                    spacing: { after: 400 }
                }),
                new Paragraph({ text: "Cronograma de Pagos", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: ["Cuota", "Fecha", "Monto", "Estado"].map(text =>
                                new TableCell({
                                    children: [new Paragraph({ text, check: true })],
                                    width: { size: 25, type: WidthType.PERCENTAGE }
                                })
                            )
                        }),
                        ...(loan.payments || []).map((p, i) =>
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph((i + 1).toString())] }),
                                    new TableCell({ children: [new Paragraph(format(new Date(p.dueDate), 'dd/MM/yyyy'))] }),
                                    new TableCell({ children: [new Paragraph(`$${p.amount.toFixed(2)}`)] }),
                                    new TableCell({ children: [new Paragraph(p.status === 'Paid' ? 'Pagado' : 'Pendiente')] }),
                                ]
                            })
                        )
                    ]
                }),
                new Paragraph({ text: "\n\n\n", spacing: { after: 400 } }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph("__________________________"),
                                        new Paragraph("Firma del Cliente")
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ text: "__________________________", alignment: AlignmentType.RIGHT }),
                                        new Paragraph({ text: "Firma del Prestamista", alignment: AlignmentType.RIGHT })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `Contrato_${client.name.replace(/\s+/g, '_')}_${loan.id}.docx`);
};

export const generateWordReceipt = async (payment, loan, client) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "RECIBO DE PAGO",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Recibo #: ${payment.id.substring(0, 8)}`,
                    alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                    text: `Fecha: ${format(new Date(), 'dd MMM yyyy pp', { locale: es })}`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 300 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Recibimos de: ", bold: true }),
                        new TextRun(client.name)
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "La suma de: ", bold: true }),
                        new TextRun({ text: `$${payment.amount.toFixed(2)}`, size: 32, bold: true })
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Concepto: ", bold: true }),
                        new TextRun(`Pago de cuota del prestamo #${loan.id}`)
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Vencimiento Original: ", bold: true }),
                        new TextRun(format(new Date(payment.dueDate), 'dd MMM yyyy'))
                    ],
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: "Gracias por su pago puntual.",
                    alignment: AlignmentType.CENTER,
                    italics: true,
                    spacing: { before: 400 }
                }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `Recibo_${payment.id}_${client.name.replace(/\s+/g, '_')}.docx`);
};
