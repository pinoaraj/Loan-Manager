import { AlignmentType, Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PizZip from 'pizzip';
import { formatRut } from './rut';

const PAGARE_TEMPLATE_PATH = '/templates/pagare_template_sc.docx';
const MUTUO_TEMPLATE_PATH = '/templates/mutuo_template_sc.doc';

const CREDITOR_NAME = 'INVERSIONES SANTA CRUZ Y COMPANIA LIMITADA';
const CREDITOR_RUT = '76.111.318-6';
const CREDITOR_ADDRESS = 'Ave. Grecia 3080-Dpto 3A, comuna de Nunoa, ciudad de Santiago';

const MUTUO_SOURCE_NAME = 'Nidia Ester Catalan Jara';
const MUTUO_SOURCE_NAME_ACCENTED = 'Nidia Ester Catalán Jara';
const MUTUO_SOURCE_RUT = '16.786.133-4';
const MUTUO_SOURCE_ADDRESS = 'Veinte de Enero 5653,Quinta Normal';
const MUTUO_SOURCE_AMOUNT = '$ 15.000.000.-';
const MUTUO_SOURCE_AMOUNT_WORDS = 'Quince millones de pesos';
const MUTUO_SOURCE_DURATION_WORDS = 'Diez meses';
const MUTUO_SOURCE_DURATION = '10 meses';
const MUTUO_SOURCE_INSTALLMENT_DAY = '10';
const MUTUO_SOURCE_INSTALLMENT_AMOUNT = '$ 1.715.000-';
const MUTUO_SOURCE_INSTALLMENT_WORDS = 'Un millón Setecientos quince mil pesos';
const MUTUO_SOURCE_RATE = '30%';
const MUTUO_SOURCE_FIRST_DUE_DATE = '10 de Octubre de 2024';
const MUTUO_SOURCE_LAST_DUE_DATE = '10 de Julio 2025';

let mutuoTemplateTextPromise;

const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

const fetchBinaryTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`No se pudo cargar la plantilla ${path}`);
    }
    return response.arrayBuffer();
};

const decodeLatin1 = (buffer) => new TextDecoder('iso-8859-1').decode(buffer);

const extractMutuoTemplateText = (rawText) => {
    const normalized = rawText.split('\0').join('');
    const bodyMatch = normalized.match(/CONTRATO DE MUTUO[\s\S]*?\(Deudor\)/);
    const body = bodyMatch ? bodyMatch[0] : normalized;

    return body
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+\n/g, '\n')
        .trim();
};

const getMutuoTemplateText = async () => {
    if (!mutuoTemplateTextPromise) {
        mutuoTemplateTextPromise = fetchBinaryTemplate(MUTUO_TEMPLATE_PATH)
            .then(decodeLatin1)
            .then(extractMutuoTemplateText);
    }

    return mutuoTemplateTextPromise;
};

const escapeXml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const legalText = (value) => {
    const text = String(value || '').trim();
    return text || '________________';
};

const normalizeLegacyText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getLoanInterestRate = (loan) => Number(loan.interestRate ?? loan.rate ?? 0);
const getLoanDurationMonths = (loan) => Number(loan.durationMonths ?? loan.term ?? 0);
const getLoanAmount = (loan) => Number(loan.amount ?? 0);
const getInstallmentAmount = (loan) => Number(loan.payments?.[0]?.amount ?? 0);
const getFirstDueDate = (loan) => (loan.payments?.[0]?.dueDate ? new Date(loan.payments[0].dueDate) : null);
const getLastDueDate = (loan) => (loan.payments?.length ? new Date(loan.payments[loan.payments.length - 1].dueDate) : null);

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

const buildPagareIntroParagraphXml = ({ name, rut, address, amount, amountWords }) => `
<w:p w14:paraId="00000004" w14:textId="155B9B5C" w:rsidR="00651A29" w:rsidRDefault="00821363">
  <w:pPr>
    <w:jc w:val="both"/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:pPr>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">Yo, </w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(name)}</w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, Cedula de identidad </w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(rut)}</w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, domiciliado(a) en </w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(address)}</w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">. Debo y pagare a la orden de </w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(CREDITOR_NAME)}</w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">, R.U.T. Nº ${escapeXml(CREDITOR_RUT)}, en su oficina de Santiago, en ${escapeXml(CREDITOR_ADDRESS)}. La cantidad de $${escapeXml(amount)}- (${escapeXml(amountWords)}), moneda local, sin intereses. Los que pagare a la vista.</w:t></w:r>
</w:p>`;

const buildPagareValueParagraphXml = (paraId, label, value, boldValue = false) => `
<w:p w14:paraId="${paraId}" w14:textId="5C227303" w:rsidR="00651A29" w:rsidRDefault="00490180">
  <w:pPr>
    <w:jc w:val="both"/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:pPr>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(label)}</w:t></w:r>
  <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${boldValue ? '<w:b/>' : ''}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(value)}</w:t></w:r>
</w:p>`;

const replaceParagraphById = (xml, paraId, newParagraphXml) => xml.replace(
    new RegExp(`<w:p[^>]*w14:paraId="${paraId}"[\\s\\S]*?<\\/w:p>`),
    newParagraphXml
);

const renderPagareFromTemplate = async (loan, client) => {
    const debtorName = legalText(client?.name);
    const debtorRut = legalText(formatRut(client?.rut || ''));
    const debtorAddress = legalText(client?.address);
    const amount = formatMoney(getLoanAmount(loan));
    const amountWords = `${numberToWords(getLoanAmount(loan))} pesos`;
    const zip = new PizZip(await fetchBinaryTemplate(PAGARE_TEMPLATE_PATH));
    let xml = zip.file('word/document.xml').asText();

    xml = replaceParagraphById(xml, '00000004', buildPagareIntroParagraphXml({
        name: debtorName,
        rut: debtorRut,
        address: debtorAddress,
        amount,
        amountWords
    }));
    xml = replaceParagraphById(xml, '00000015', buildPagareValueParagraphXml('00000015', 'DEUDOR (CLIENTE)  : ', debtorName, true));
    xml = replaceParagraphById(xml, '00000016', buildPagareValueParagraphXml('00000016', 'R.U.T. DEUDOR    : ', debtorRut));

    zip.file('word/document.xml', xml);

    const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    downloadBlob(blob, `Pagare_${normalizeDocumentName(debtorName)}_${loan.id}.docx`);
};

const replaceMutuoValues = (templateText, replacements) => {
    let output = templateText;

    replacements.forEach(({ from, to }) => {
        output = output.split(from).join(to);
    });

    return output;
};

const buildMutuoText = async (loan, client) => {
    const debtorName = legalText(client?.name);
    const debtorRut = legalText(formatRut(client?.rut || ''));
    const debtorAddress = legalText(client?.address);
    const debtorNamePlain = normalizeLegacyText(debtorName);
    const debtorAddressPlain = normalizeLegacyText(debtorAddress);
    const amount = getLoanAmount(loan);
    const installmentAmount = getInstallmentAmount(loan);
    const durationMonths = getLoanDurationMonths(loan);
    const firstDueDate = getFirstDueDate(loan);
    const lastDueDate = getLastDueDate(loan);
    const dueDay = firstDueDate ? format(firstDueDate, 'd') : '__';
    const installmentMonthsLabel = `${durationMonths} meses`;
    const amountLabel = `$ ${formatMoney(amount)}.-`;
    const amountWordsLabel = `${numberToWords(amount)} pesos`;
    const installmentAmountLabel = `$ ${formatMoney(installmentAmount)}-`;
    const installmentWordsLabel = `${numberToWords(installmentAmount)} pesos`;
    const annualRate = `${(getAnnualRate(loan) * 100).toFixed(2)}%`;
    const firstDueDateLabel = firstDueDate ? format(firstDueDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : '________________';
    const lastDueDateLabel = lastDueDate ? format(lastDueDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : '________________';
    const templateText = await getMutuoTemplateText();

    return replaceMutuoValues(templateText, [
        { from: MUTUO_SOURCE_NAME_ACCENTED, to: debtorName },
        { from: MUTUO_SOURCE_NAME, to: debtorNamePlain },
        { from: MUTUO_SOURCE_RUT, to: debtorRut },
        { from: MUTUO_SOURCE_ADDRESS, to: debtorAddressPlain },
        { from: MUTUO_SOURCE_AMOUNT, to: amountLabel },
        { from: MUTUO_SOURCE_AMOUNT_WORDS, to: amountWordsLabel },
        { from: MUTUO_SOURCE_DURATION_WORDS, to: installmentMonthsLabel },
        { from: MUTUO_SOURCE_DURATION, to: installmentMonthsLabel },
        { from: `días ${MUTUO_SOURCE_INSTALLMENT_DAY} de cada mes`, to: `días ${dueDay} de cada mes` },
        { from: MUTUO_SOURCE_INSTALLMENT_AMOUNT, to: installmentAmountLabel },
        { from: MUTUO_SOURCE_INSTALLMENT_WORDS, to: installmentWordsLabel },
        { from: MUTUO_SOURCE_RATE, to: annualRate },
        { from: MUTUO_SOURCE_FIRST_DUE_DATE, to: firstDueDateLabel },
        { from: MUTUO_SOURCE_LAST_DUE_DATE, to: lastDueDateLabel }
    ]);
};

const buildMutuoDocument = async (loan, client) => {
    const debtorName = legalText(client?.name);
    const mutuoText = await buildMutuoText(loan, client);
    const paragraphs = mutuoText
        .split(/\r?\n\r?\n/)
        .map((block, index) => new Paragraph({
            text: block.replace(/\r?\n/g, ' '),
            heading: index === 0 ? HeadingLevel.TITLE : undefined,
            alignment: index <= 3 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { after: 220 }
        }));

    const document = new Document({
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    const blob = await Packer.toBlob(document);
    downloadBlob(blob, `Mutuo_${normalizeDocumentName(debtorName)}_${loan.id}.docx`);
};

export const generatePagare = async (loan, client) => {
    await renderPagareFromTemplate(loan, client);
};

export const generatePagareFromTemplate = async (data) => {
    await renderPagareFromTemplate(
        { id: data.loanId || 'sin-prestamo', amount: Number(data.loanAmount || 0), payments: [] },
        { name: data.clientName, rut: data.rut, address: data.address }
    );
};

export const generateMutuoDocument = async (loan, client) => {
    await buildMutuoDocument(loan, client);
};
