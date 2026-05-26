import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatRut } from './rut';

const CREDITOR_NAME = 'INVERSIONES SANTA CRUZ Y COMPAÑIA LIMITADA';
const CREDITOR_RUT = '76.111.318-6';
const CREDITOR_ADDRESS = 'Ave. Grecia 3080-Dpt 3A, comuna de Ñuñoa, ciudad de Santiago';

const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

const getLoanInterestRate = (loan) => Number(loan.interestRate ?? loan.rate ?? 0);
const getLoanDurationMonths = (loan) => Number(loan.durationMonths ?? loan.term ?? 0);
const getLoanAmount = (loan) => Number(loan.amount ?? 0);
const getInstallmentAmount = (loan) => Number(loan.payments?.[0]?.amount ?? 0);
const getFirstDueDate = (loan) => loan.payments?.[0]?.dueDate ? new Date(loan.payments[0].dueDate) : null;
const getLastDueDate = (loan) => loan.payments?.length ? new Date(loan.payments[loan.payments.length - 1].dueDate) : null;

const formatMoney = (value) => Number(value || 0).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const normalizeDocumentName = (value = 'cliente') => String(value).trim().replace(/\s+/g, '_');

const getAnnualRate = (loan) => {
    const perPeriodRate = getLoanInterestRate(loan);
    const frequency = String(loan.frequency || '').toLowerCase();

    if (frequency === 'weekly') return perPeriodRate * 52;
    if (frequency === 'biweekly' || frequency === 'bi-weekly') return perPeriodRate * 26;
    return perPeriodRate * 12;
};

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const TEENS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'];
const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

const numberUnderHundredToWords = (value) => {
    if (value < 10) return UNITS[value];
    if (value < 20) return TEENS[value - 10];
    if (value < 30) return value === 20 ? 'veinte' : `veinti${UNITS[value - 20]}`;

    const tens = Math.floor(value / 10);
    const units = value % 10;
    return units === 0 ? TENS[tens] : `${TENS[tens]} y ${UNITS[units]}`;
};

const numberUnderThousandToWords = (value) => {
    if (value === 0) return '';
    if (value === 100) return 'cien';
    if (value < 100) return numberUnderHundredToWords(value);

    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    return `${HUNDREDS[hundreds]}${remainder ? ` ${numberUnderHundredToWords(remainder)}` : ''}`;
};

const numberToWords = (value) => {
    const amount = Math.round(Number(value || 0));
    if (!Number.isFinite(amount) || amount <= 0) return 'cero';
    if (amount < 1000) return numberUnderThousandToWords(amount);
    if (amount < 1000000) {
        const thousands = Math.floor(amount / 1000);
        const remainder = amount % 1000;
        const thousandsLabel = thousands === 1 ? 'mil' : `${numberUnderThousandToWords(thousands)} mil`;
        return `${thousandsLabel}${remainder ? ` ${numberUnderThousandToWords(remainder)}` : ''}`;
    }

    const millions = Math.floor(amount / 1000000);
    const remainder = amount % 1000000;
    const millionsLabel = millions === 1 ? 'un millon' : `${numberToWords(millions)} millones`;
    if (!remainder) return millionsLabel;

    if (remainder < 1000) return `${millionsLabel} ${numberUnderThousandToWords(remainder)}`;

    const thousands = Math.floor(remainder / 1000);
    const rest = remainder % 1000;
    const thousandsLabel = thousands === 1 ? 'mil' : `${numberUnderThousandToWords(thousands)} mil`;
    return `${millionsLabel} ${thousandsLabel}${rest ? ` ${numberUnderThousandToWords(rest)}` : ''}`;
};

const legalText = (value) => {
    const text = String(value || '').trim();
    return text || '________________';
};

const buildDocument = async (title, filename, paragraphs) => {
    const document = new Document({
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    const blob = await Packer.toBlob(document);
    downloadBlob(blob, filename);
};

export const generatePagare = async (loan, client) => {
    const amount = getLoanAmount(loan);
    const amountText = `${numberToWords(amount)} pesos`;
    const debtorName = legalText(client?.name);
    const debtorRut = legalText(formatRut(client?.rut || ''));
    const debtorAddress = legalText(client?.address);
    const signedDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

    await buildDocument(
        'Pagare',
        `Pagare_${normalizeDocumentName(debtorName)}_${loan.id}.docx`,
        [
            new Paragraph({
                text: 'PAGARE',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 280 }
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                children: [
                    new TextRun('Yo, '),
                    new TextRun({ text: debtorName, bold: true }),
                    new TextRun(', cédula de identidad '),
                    new TextRun({ text: debtorRut, bold: true }),
                    new TextRun(', domiciliado(a) en '),
                    new TextRun({ text: debtorAddress, bold: true }),
                    new TextRun(', debo y pagaré a la orden de '),
                    new TextRun({ text: CREDITOR_NAME, bold: true }),
                    new TextRun(`, R.U.T. N° ${CREDITOR_RUT}, en su oficina de Santiago, en ${CREDITOR_ADDRESS}.`)
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                children: [
                    new TextRun('La cantidad de $'),
                    new TextRun({ text: formatMoney(amount), bold: true }),
                    new TextRun(' ('),
                    new TextRun({ text: amountText, italics: true }),
                    new TextRun('), moneda local, pagadera según las condiciones del crédito suscrito con el acreedor.')
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                text: 'En caso de mora o simple retardo en el pago, se devengará un interés penal igual al interés máximo convencional permitido por la ley a la fecha de suscripción de este pagaré, además de los gastos de cobranza, protesto, notaría e impuesto de timbres y estampillas que procedan.'
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                text: `Las obligaciones derivadas de este pagaré tendrán carácter de indivisibles, pudiendo ${CREDITOR_NAME} cobrarlas íntegramente en la ciudad de Santiago.`
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300 },
                text: 'Autorizo expresa e irrevocablemente al acreedor para informar o comunicar a cualquier base de datos mis antecedentes personales consignados en el presente instrumento, así como el incumplimiento, simple retardo o mora en que incurra respecto de las obligaciones que emanan de este pagaré.'
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 500 },
                text: `En Santiago, a ${signedDate}.`
            }),
            new Paragraph({
                text: '__________________________________________________',
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'FIRMA DEL DEUDOR',
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 }
            }),
            new Paragraph({
                children: [
                    new TextRun('DEUDOR (CLIENTE): '),
                    new TextRun({ text: debtorName, bold: true })
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun('R.U.T. DEUDOR: '),
                    new TextRun({ text: debtorRut, bold: true })
                ]
            })
        ]
    );
};

export const generatePagareFromTemplate = async (data) => {
    await generatePagare(
        { id: data.loanId || 'sin-prestamo', amount: Number(data.loanAmount || 0), payments: [] },
        { name: data.clientName, rut: data.rut, address: data.address }
    );
};

export const generateMutuoDocument = async (loan, client) => {
    const debtorName = legalText(client?.name);
    const debtorRut = legalText(formatRut(client?.rut || ''));
    const debtorAddress = legalText(client?.address);
    const amount = getLoanAmount(loan);
    const amountText = `${numberToWords(amount)} pesos`;
    const installments = loan.payments?.length || getLoanDurationMonths(loan);
    const installmentAmount = getInstallmentAmount(loan);
    const installmentAmountText = `${numberToWords(installmentAmount)} pesos`;
    const annualRate = (getAnnualRate(loan) * 100).toFixed(2);
    const firstDueDate = getFirstDueDate(loan);
    const lastDueDate = getLastDueDate(loan);
    const dueDay = firstDueDate ? format(firstDueDate, 'd') : '__';
    const startLabel = firstDueDate ? format(firstDueDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : '________________';
    const endLabel = lastDueDate ? format(lastDueDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : '________________';

    await buildDocument(
        'Mutuo',
        `Mutuo_${normalizeDocumentName(debtorName)}_${loan.id}.docx`,
        [
            new Paragraph({
                text: 'CONTRATO DE MUTUO',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'DE',
                alignment: AlignmentType.CENTER
            }),
            new Paragraph({
                text: 'INVERSIONES SANTA CRUZ LIMITADA',
                alignment: AlignmentType.CENTER,
                spacing: { after: 220 }
            }),
            new Paragraph({
                text: `A ${debtorName}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 260 }
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                children: [
                    new TextRun('Yo, Juan Pablo Pino Arauz, chileno, casado, factor de comercio, cédula nacional de identidad número 8.823.029-9, domiciliado en Ave. Santa Sofía 6717, La Florida, en representación de la sociedad Inversiones Santa Cruz Limitada, rol único tributario 76.111.318-6, en adelante, "el acreedor"; y don(a) '),
                    new TextRun({ text: debtorName, bold: true }),
                    new TextRun(', cédula nacional de identidad número '),
                    new TextRun({ text: debtorRut, bold: true }),
                    new TextRun(', domiciliado(a) en '),
                    new TextRun({ text: debtorAddress, bold: true }),
                    new TextRun(', en adelante, "el deudor"; ambos mayores de edad, convienen en celebrar el siguiente contrato de mutuo.')
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                children: [
                    new TextRun('PRIMERO. El acreedor entrega al deudor, en este acto, la suma de $'),
                    new TextRun({ text: formatMoney(amount), bold: true }),
                    new TextRun(' ('),
                    new TextRun({ text: amountText, italics: true }),
                    new TextRun('), en calidad de préstamo, cantidad que se restituirá a Inversiones Santa Cruz Limitada en cuotas, en el plazo total pactado en la cláusula segunda.')
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                children: [
                    new TextRun(`SEGUNDO. El capital entregado en mutuo se restituirá en ${installments} cuotas, con vencimiento los días ${dueDay} de cada periodo, por un valor referencial de $`),
                    new TextRun({ text: formatMoney(installmentAmount), bold: true }),
                    new TextRun(' ('),
                    new TextRun({ text: installmentAmountText, italics: true }),
                    new TextRun(`) cada una, considerando una tasa nominal anual referencial de ${annualRate}%. El pago de dichas cuotas comenzará a ser exigible desde el día ${startLabel} y terminará el ${endLabel}.`)
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                text: 'TERCERO. El no pago oportuno de una cuota cualquiera de los intereses correspondientes y de una cualquiera de las cuotas de restitución del capital hará exigible, de inmediato, el total de la obligación en capital e intereses, la que se considerará de plazo vencido y entrará a devengar el interés máximo permitido por la ley, a título de cláusula penal.'
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                text: 'CUARTO. El deudor declara que su estado civil es el consignado en la comparecencia de este instrumento.'
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220 },
                text: 'QUINTO. Para todos los efectos legales de este contrato, los comparecientes fijan su domicilio en la ciudad de Santiago y prorrogan competencia para ante los tribunales de la misma.'
            }),
            new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 320 },
                text: 'SEXTO. El incumplimiento, por parte del deudor, de una sola de las obligaciones de este contrato producirá la aceleración de los plazos y hará que se tengan todas las cuotas del mismo, ipso facto, como de plazo vencido.'
            }),
            new Paragraph({
                text: 'En comprobante, firman:',
                spacing: { after: 280 }
            }),
            new Paragraph({
                text: 'El Representante Legal de Inversiones Santa Cruz Limitada',
                spacing: { after: 120 }
            }),
            new Paragraph({
                text: 'Juan Pablo Pino Arauz (Acreedor)',
                spacing: { after: 120 }
            }),
            new Paragraph({
                text: `${debtorName} (Deudor)`,
                spacing: { after: 120 }
            }),
            new Paragraph({
                text: `RUT Deudor: ${debtorRut}`
            }),
            new Paragraph({
                text: `Direccion Deudor: ${debtorAddress}`
            })
        ]
    );
};
