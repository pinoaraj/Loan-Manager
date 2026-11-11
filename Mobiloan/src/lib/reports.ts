import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { formatCurrency, formatDate } from './format';

import type {
  ClientRecord,
  LoanListItem,
  LoanRecord,
  PaymentRecord,
  PortableSyncPackage,
} from '../types/sync';

const COMPANY_NAME = 'Loan Manager';
const CREDITOR_NAME = 'INVERSIONES SANTA CRUZ Y COMPANIA LIMITADA';
const CREDITOR_RUT = '76.111.318-6';
const CREDITOR_ADDRESS = 'Ave. Grecia 3080-Dpto 3A, comuna de Nunoa, ciudad de Santiago';

const UNIDADES = [
  'cero',
  'un',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciseis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
];
const VEINTI = [
  'veintiuno',
  'veintidos',
  'veintitres',
  'veinticuatro',
  'veinticinco',
  'veintiseis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

const seccion = (value: number): string => {
  if (value === 0) {
    return '';
  }

  if (value === 100) {
    return 'cien';
  }

  const centena = Math.floor(value / 100);
  const resto = value % 100;
  const parts: string[] = [];

  if (centena > 0) {
    parts.push(CENTENAS[centena]);
  }

  if (resto > 0) {
    if (resto <= 20) {
      parts.push(UNIDADES[resto]);
    } else if (resto < 30) {
      parts.push(VEINTI[resto - 21]);
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      parts.push(unidad > 0 ? `${DECENAS[decena]} y ${UNIDADES[unidad]}` : DECENAS[decena]);
    }
  }

  return parts.join(' ');
};

export const numeroALetras = (value: number): string => {
  let restante = Math.floor(Math.abs(Number.isFinite(value) ? value : 0));
  if (restante === 0) {
    return 'cero';
  }

  const partes: string[] = [];

  const billones = Math.floor(restante / 1_000_000_000_000);
  if (billones > 0) {
    partes.push(`${billones === 1 ? 'un' : numeroALetras(billones)} ${billones === 1 ? 'billon' : 'billones'}`);
    restante %= 1_000_000_000_000;
  }

  const millones = Math.floor(restante / 1_000_000);
  if (millones > 0) {
    partes.push(`${millones === 1 ? 'un' : numeroALetras(millones)} ${millones === 1 ? 'millon' : 'millones'}`);
    restante %= 1_000_000;
  }

  const miles = Math.floor(restante / 1_000);
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${numeroALetras(miles)} mil`);
    restante %= 1_000;
  }

  if (restante > 0) {
    partes.push(seccion(restante));
  }

  return partes.join(' ').replace(/\s+/g, ' ').trim();
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getFileSafeLabel = (value: string, fallback = 'documento') =>
  String(value ?? fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '') || fallback;

const baseStyles = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0F172A;
    margin: 0;
    padding: 32px;
    font-size: 12px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
  .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0E7490; padding-bottom: 16px; }
  .brand small { color: #64748B; }
  .muted { color: #64748B; }
  .grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
  .box { flex: 1 1 45%; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; }
  .box strong { display: block; font-size: 11px; text-transform: uppercase; color: #64748B; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; }
  th { background: #F1F5F9; font-size: 11px; text-transform: uppercase; }
  td.num, th.num { text-align: right; }
  .total { margin-top: 12px; text-align: right; font-size: 14px; font-weight: 700; }
  .signature { margin-top: 56px; display: flex; gap: 48px; }
  .signature div { flex: 1; border-top: 1px solid #0F172A; padding-top: 8px; text-align: center; }
  .note { margin-top: 16px; color: #475569; font-size: 11px; }
`;

const renderPaymentRows = (payments: PaymentRecord[]) =>
  payments
    .map((payment) => {
      const total = payment.amount + payment.lateFee;
      const remaining = Math.max(total - payment.paidAmount, 0);

      return `
        <tr>
          <td>${escapeHtml(formatDate(payment.dueDate))}</td>
          <td class="num">${escapeHtml(formatCurrency(payment.amount))}</td>
          <td class="num">${escapeHtml(formatCurrency(payment.lateFee))}</td>
          <td class="num">${escapeHtml(formatCurrency(payment.paidAmount))}</td>
          <td class="num">${escapeHtml(formatCurrency(remaining))}</td>
          <td>${escapeHtml(payment.status)}</td>
        </tr>
      `;
    })
    .join('');

export const buildContractHtml = ({
  loan,
  client,
  payments,
}: {
  loan: LoanRecord;
  client: ClientRecord | null;
  payments: PaymentRecord[];
}) => {
  const totalScheduled = payments.reduce((sum, payment) => sum + payment.amount + payment.lateFee, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="brand">
        <div>
          <h1>Contrato de prestamo</h1>
          <small>${escapeHtml(COMPANY_NAME)} - Documento generado desde Mobiloan</small>
        </div>
        <div style="text-align:right">
          <small>Fecha de emision</small><br />
          <strong>${escapeHtml(formatDate(new Date()))}</strong>
        </div>
      </div>

      <h2>Datos del cliente</h2>
      <div class="grid">
        <div class="box"><strong>Nombre</strong>${escapeHtml(client?.name || 'No registrado')}</div>
        <div class="box"><strong>RUT</strong>${escapeHtml(client?.rut || 'No registrado')}</div>
        <div class="box"><strong>Telefono</strong>${escapeHtml(client?.phone || 'No registrado')}</div>
        <div class="box"><strong>Email</strong>${escapeHtml(client?.email || 'No registrado')}</div>
        <div class="box" style="flex:1 1 100%"><strong>Direccion</strong>${escapeHtml(client?.address || 'No registrada')}</div>
      </div>

      <h2>Condiciones del prestamo</h2>
      <div class="grid">
        <div class="box"><strong>Monto prestado</strong>${escapeHtml(formatCurrency(loan.amount))}</div>
        <div class="box"><strong>Tasa de interes</strong>${escapeHtml(`${(loan.interestRate * 100).toFixed(2)}%`)}</div>
        <div class="box"><strong>Plazo</strong>${escapeHtml(`${loan.durationMonths} meses`)}</div>
        <div class="box"><strong>Frecuencia</strong>${escapeHtml(loan.frequency)}</div>
        <div class="box"><strong>Tipo</strong>${escapeHtml(loan.loanType)}</div>
        <div class="box"><strong>Fecha de inicio</strong>${escapeHtml(formatDate(loan.startDate))}</div>
        <div class="box"><strong>Total programado</strong>${escapeHtml(formatCurrency(totalScheduled))}</div>
        <div class="box"><strong>Total pagado</strong>${escapeHtml(formatCurrency(totalPaid))}</div>
      </div>

      <h2>Calendario de cuotas</h2>
      <table>
        <thead>
          <tr>
            <th>Vencimiento</th>
            <th class="num">Cuota</th>
            <th class="num">Mora</th>
            <th class="num">Pagado</th>
            <th class="num">Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${renderPaymentRows(payments)}</tbody>
      </table>

      <div class="total">Saldo pendiente: ${escapeHtml(formatCurrency(Math.max(totalScheduled - totalPaid, 0)))}</div>

      <p class="note">
        El cliente declara recibir conforme el monto indicado y se obliga a pagar las cuotas en las fechas
        senaladas. El presente documento es un respaldo generado desde la aplicacion Mobiloan y no reemplaza
        los documentos firmados en papel cuando la legislacion lo exija.
      </p>

      <div class="signature">
        <div>${escapeHtml(client?.name || 'Cliente')}<br /><small>Cliente</small></div>
        <div>${escapeHtml(COMPANY_NAME)}<br /><small>Acreedor</small></div>
      </div>
    </body>
  </html>`;
};

export const buildPromissoryNoteHtml = ({
  loan,
  client,
  payments,
}: {
  loan: LoanRecord;
  client: ClientRecord | null;
  payments: PaymentRecord[];
}) => {
  const totalScheduled = payments.reduce((sum, payment) => sum + payment.amount + payment.lateFee, 0);
  const firstDue = payments[0]?.dueDate;
  const lastDue = payments[payments.length - 1]?.dueDate;

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="brand">
        <div>
          <h1>Pagare</h1>
          <small>Documento generado desde Mobiloan</small>
        </div>
        <div style="text-align:right">
          <small>Santiago,</small><br />
          <strong>${escapeHtml(formatDate(new Date()))}</strong>
        </div>
      </div>

      <p style="margin-top:24px;font-size:13px">
        Debo y pagare a la orden de <strong>${escapeHtml(CREDITOR_NAME)}</strong>, RUT
        <strong>${escapeHtml(CREDITOR_RUT)}</strong>, con domicilio en ${escapeHtml(CREDITOR_ADDRESS)},
        la cantidad de <strong>${escapeHtml(formatCurrency(totalScheduled))}</strong>
        (${escapeHtml(numeroALetras(totalScheduled))} pesos), en las cuotas y fechas que se indican a continuacion.
      </p>

      <h2>Datos del deudor</h2>
      <div class="grid">
        <div class="box"><strong>Nombre</strong>${escapeHtml(client?.name || 'No registrado')}</div>
        <div class="box"><strong>RUT</strong>${escapeHtml(client?.rut || 'No registrado')}</div>
        <div class="box"><strong>Telefono</strong>${escapeHtml(client?.phone || 'No registrado')}</div>
        <div class="box" style="flex:1 1 100%"><strong>Direccion</strong>${escapeHtml(client?.address || 'No registrada')}</div>
      </div>

      <h2>Forma de pago</h2>
      <p>
        ${escapeHtml(`${payments.length} cuotas`)} con frecuencia ${escapeHtml(loan.frequency)},
        desde el ${escapeHtml(formatDate(firstDue))} hasta el ${escapeHtml(formatDate(lastDue))}.
        El deudor se obliga al pago puntual de cada cuota y acepta la mora aplicable.
      </p>

      <table>
        <thead>
          <tr>
            <th>Vencimiento</th>
            <th class="num">Cuota</th>
            <th class="num">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (payment) => `
                <tr>
                  <td>${escapeHtml(formatDate(payment.dueDate))}</td>
                  <td class="num">${escapeHtml(formatCurrency(payment.amount + payment.lateFee))}</td>
                  <td class="num">${escapeHtml(
                    formatCurrency(Math.max(payment.amount + payment.lateFee - payment.paidAmount, 0)),
                  )}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>

      <p class="note">
        El presente pagare se emite en respaldo digital. La referencia del prestamo es
        ${escapeHtml(loan.id)} y el monto original prestado es ${escapeHtml(formatCurrency(loan.amount))}.
      </p>

      <div class="signature">
        <div>${escapeHtml(client?.name || 'Deudor')}<br /><small>Deudor</small></div>
        <div>${escapeHtml(CREDITOR_NAME)}<br /><small>Acreedor</small></div>
      </div>
    </body>
  </html>`;
};

export const buildInstallmentsCsv = (payments: PaymentRecord[]) => {
  const header = ['Cuota', 'Vencimiento', 'Monto', 'Mora', 'Pagado', 'Saldo', 'Estado'];
  const lines = payments.map((payment, index) => {
    const total = payment.amount + payment.lateFee;
    const remaining = Math.max(total - payment.paidAmount, 0);

    return [
      String(index + 1),
      formatDate(payment.dueDate),
      String(Math.round(payment.amount)),
      String(Math.round(payment.lateFee)),
      String(Math.round(payment.paidAmount)),
      String(Math.round(remaining)),
      payment.status,
    ]
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(';');
  });

  return `\uFEFF${[header.join(';'), ...lines].join('\r\n')}`;
};

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const buildPortfolioCsv = (loans: LoanListItem[]) => {
  const header = [
    'Cliente',
    'Telefono',
    'Monto',
    'Meses',
    'Frecuencia',
    'Estado',
    'Programado',
    'Pagado',
    'Saldo',
    'Cuotas vencidas',
    'Monto vencido',
    'Proxima cuota',
  ];

  const lines = loans.map((loan) =>
    [
      loan.clientName,
      loan.clientPhone ?? '',
      Math.round(loan.amount),
      loan.durationMonths,
      loan.frequency,
      loan.status,
      Math.round(loan.totalScheduled),
      Math.round(loan.totalPaid),
      Math.round(loan.totalRemaining),
      loan.overdueCount,
      Math.round(loan.overdueAmount),
      loan.nextDueDate ? formatDate(loan.nextDueDate) : '',
    ]
      .map(csvCell)
      .join(';'),
  );

  return `\uFEFF${[header.map(csvCell).join(';'), ...lines].join('\r\n')}`;
};

export const sharePortfolioCsv = async (loans: LoanListItem[]) => {
  const csv = buildPortfolioCsv(loans);
  const today = new Date().toISOString().slice(0, 10);
  const fileUri = await writeTempFile(`cartera_${today}.csv`, csv);
  await ensureSharing();
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartir cartera',
  });
  return fileUri;
};

const ensureSharing = async () => {
  if (Platform.OS === 'web') {
    throw new Error('Compartir documentos esta pensado para Android o iOS.');
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('El dispositivo no permite compartir archivos desde esta app.');
  }
};

const writeTempFile = async (filename: string, content: string) => {
  const directory = FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('No se pudo acceder al almacenamiento temporal del dispositivo.');
  }

  const fileUri = `${directory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
};

export const shareContractPdf = async (input: {
  loan: LoanRecord;
  client: ClientRecord | null;
  payments: PaymentRecord[];
}) => {
  const html = buildContractHtml(input);
  const { uri } = await Print.printToFileAsync({ html });
  await ensureSharing();
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir contrato',
    UTI: 'com.adobe.pdf',
  });
  return uri;
};

export const sharePromissoryNotePdf = async (input: {
  loan: LoanRecord;
  client: ClientRecord | null;
  payments: PaymentRecord[];
}) => {
  const html = buildPromissoryNoteHtml(input);
  const { uri } = await Print.printToFileAsync({ html });
  await ensureSharing();
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir pagare',
    UTI: 'com.adobe.pdf',
  });
  return uri;
};

export const shareInstallmentsCsv = async (input: {
  loan: LoanRecord;
  client: ClientRecord | null;
  payments: PaymentRecord[];
}) => {
  const csv = buildInstallmentsCsv(input.payments);
  const filename = `cuotas_${getFileSafeLabel(input.client?.name || 'cliente')}_${getFileSafeLabel(
    input.loan.id,
    'prestamo',
  )}.csv`;
  const fileUri = await writeTempFile(filename, csv);
  await ensureSharing();
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartir cuotas',
  });
  return fileUri;
};

export const pickPortableSnapshot = async (): Promise<PortableSyncPackage | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: PortableSyncPackage;
  try {
    parsed = JSON.parse(content) as PortableSyncPackage;
  } catch {
    throw new Error('El archivo seleccionado no contiene JSON valido.');
  }

  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.clients)) {
    throw new Error('El archivo no parece un respaldo Mobiloan valido.');
  }

  return parsed;
};
