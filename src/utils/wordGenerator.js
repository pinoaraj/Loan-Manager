import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import PizZipUtils from 'pizzip/utils/index.js';

function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}

const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const generateWordContract = async (loan, client) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "CONTRATO DE PRÉSTAMO",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Fecha: ${format(new Date(), 'dd MMM yyyy', { locale: es })}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),

                // Client Info
                new Paragraph({ text: "Información del Cliente", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Nombre: ${client.name}`, bullet: { level: 0 } }),
                new Paragraph({ text: `ID: ${client.id}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Email: ${client.email}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Teléfono: ${client.phone}`, bullet: { level: 0 }, spacing: { after: 300 } }),

                // Loan Details
                new Paragraph({ text: "Detalles del Préstamo", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Monto Prestado: $${loan.amount.toFixed(2)}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Tasa de Interés: ${(loan.rate * 100).toFixed(1)}% (${loan.frequency})`, bullet: { level: 0 } }),
                new Paragraph({ text: `Duración: ${loan.term} meses`, bullet: { level: 0 } }),
                new Paragraph({ text: `Fecha de Inicio: ${format(new Date(loan.startDate), 'dd MMM yyyy')}`, bullet: { level: 0 }, spacing: { after: 300 } }),

                // Terms
                new Paragraph({ text: "Términos y Condiciones", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({
                    text: "El Prestatario se compromete a pagar al Prestamista el monto total del préstamo más los intereses devengados según el cronograma de pagos adjunto. En caso de mora, se aplicarán penalidades adicionales según lo estipulado por la ley vigente.",
                    spacing: { after: 400 }
                }),

                // Schedule (Simplified for Word)
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

                // Signatures
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
                        new TextRun(`Pago de cuota del préstamo #${loan.id}`)
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

export const generatePagare = async (loan, client) => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "PAGARÉ",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Por valor de: $${loan.amount.toFixed(2)}`,
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun("Debo y pagaré incondicionalmente a la orden de "),
                        new TextRun({ text: "Loan Manager", bold: true }), // Or make this configurable
                        new TextRun(` en la ciudad de _______________, el día ${format(new Date(loan.startDate), 'dd MMM yyyy', { locale: es })}.`)
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun("La cantidad de: "),
                        new TextRun({ text: `$${loan.amount.toFixed(2)}`, bold: true }),
                        new TextRun(" ("),
                        // numberToWords logic could go here if we had a library, skipping for now
                        new TextRun("valor recibido a mi entera satisfacción).")
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun(`Este pagaré forma parte de una serie numerada del 1 al ${loan.payments.length} y todos están sujetos a la condición de que, al no pagarse cualquiera de ellos a su vencimiento, serán exigibles todos los que le sigan en número, además de los ya vencidos.`)
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun(`Valor recibido a mi entera satisfacción. Este pagaré causará intereses a la tasa de ${(loan.rate * 100).toFixed(1)}% mensual sobre saldos insolutos.`)
                    ],
                    spacing: { after: 400 },
                    alignment: AlignmentType.JUSTIFIED
                }),

                // Signatures
                new Paragraph({ text: "\n\n\n", spacing: { after: 400 } }),
                new Paragraph({
                    text: "__________________________",
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: client.name,
                    bold: true,
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: `ID: ${client.id}`,
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: "ACEPTO(AMOS)",
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200 }
                })
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `Pagare_${client.name.replace(/\s+/g, '_')}_${loan.id}.docx`);
};

export const generatePagareFromTemplate = (data, templateName = 'pagare_template.docx') => {
    loadFile(`/${templateName}`, function (error, content) {
        if (error) {
            console.error("Error loading template:", error);
            alert("Error cargando la plantilla del pagaré. Verifique que 'pagare_template.docx' exista en la carpeta public.");
            throw error;
        }

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Data rendering
        doc.render(data);

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Output the document using Data-URI
        downloadBlob(out, `Pagare_${data.clientName.replace(/\s+/g, '_')}.docx`);
    });
};
