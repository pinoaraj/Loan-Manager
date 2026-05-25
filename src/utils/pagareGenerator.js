import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import PizZipUtils from 'pizzip/utils/index.js';

function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}

const getLoanInterestRate = (loan) => Number(loan.interestRate ?? loan.rate ?? 0);

const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

export const generatePagare = async (loan, client) => {
    const interestRate = getLoanInterestRate(loan);

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "PAGARE",
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
                        new TextRun("Debo y pagare incondicionalmente a la orden de "),
                        new TextRun({ text: "Loan Manager", bold: true }),
                        new TextRun(` en la ciudad de _______________, el dia ${format(new Date(loan.startDate), 'dd MMM yyyy', { locale: es })}.`)
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun("La cantidad de: "),
                        new TextRun({ text: `$${loan.amount.toFixed(2)}`, bold: true }),
                        new TextRun(" ("),
                        new TextRun("valor recibido a mi entera satisfaccion).")
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun(`Este pagare forma parte de una serie numerada del 1 al ${loan.payments.length} y todos estan sujetos a la condicion de que, al no pagarse cualquiera de ellos a su vencimiento, seran exigibles todos los que le sigan en numero, ademas de los ya vencidos.`)
                    ],
                    spacing: { after: 200 },
                    alignment: AlignmentType.JUSTIFIED
                }),
                new Paragraph({
                    children: [
                        new TextRun(`Valor recibido a mi entera satisfaccion. Este pagare causara intereses a la tasa de ${(interestRate * 100).toFixed(1)}% mensual sobre saldos insolutos.`)
                    ],
                    spacing: { after: 400 },
                    alignment: AlignmentType.JUSTIFIED
                }),
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
            alert("Error cargando la plantilla del pagare. Verifique que 'pagare_template.docx' exista en la carpeta public.");
            throw error;
        }

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        downloadBlob(out, `Pagare_${data.clientName.replace(/\s+/g, '_')}.docx`);
    });
};
