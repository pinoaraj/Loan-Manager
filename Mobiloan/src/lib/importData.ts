import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

import { localDb } from '../data/database';
import { todayDateKey, toLocalDateKey } from './dates';

import type {
  ClientRecord,
  PortableSyncPackage,
} from '../types/sync';

export type ImportFieldKey =
  | 'clientName'
  | 'rut'
  | 'amount'
  | 'interest'
  | 'duration'
  | 'date';

export type ImportMapping = Record<ImportFieldKey, string>;

export const IMPORT_FIELDS: Array<{
  key: ImportFieldKey;
  label: string;
  hint: string;
  required?: boolean;
}> = [
  { key: 'clientName', label: 'Nombre cliente', hint: 'Obligatorio', required: true },
  { key: 'rut', label: 'RUT', hint: 'Necesario si el cliente es nuevo' },
  { key: 'amount', label: 'Monto prestamo', hint: 'Obligatorio', required: true },
  { key: 'interest', label: 'Tasa interes', hint: '0.1 = 10%. Por defecto 10%' },
  { key: 'duration', label: 'Plazo (meses)', hint: 'Por defecto 12 meses' },
  { key: 'date', label: 'Fecha inicio', hint: 'Por defecto hoy' },
];

export interface SheetImportFile {
  kind: 'sheet';
  fileName: string;
  columns: string[];
  rows: Array<Array<unknown>>;
  mapping: ImportMapping;
}

export interface PortableImportFile {
  kind: 'portable';
  fileName: string;
  payload: PortableSyncPackage;
}

export type PickedImportFile = SheetImportFile | PortableImportFile;

export interface PreviewClient {
  /** Id real del cliente existente o id temporal para los que se crearan. */
  tempId: string;
  name: string;
  rut: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isNew: boolean;
}

export interface PreviewLoan {
  clientTempId: string;
  clientName: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
}

export interface SpreadsheetPreview {
  source: 'spreadsheet';
  fileName: string;
  clients: PreviewClient[];
  loans: PreviewLoan[];
  skippedCount: number;
  totalRows: number;
}

export interface PortablePreview {
  source: 'mobiloan-portable';
  fileName: string;
  payload: PortableSyncPackage;
  clients: number;
  loans: number;
  payments: number;
  paymentTransactions: number;
  pendingOutbox: number;
  exportedAt: string | null;
}

export type ImportPreview = SpreadsheetPreview | PortablePreview;

export interface SpreadsheetImportResult {
  clients: number;
  loans: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const FIELD_PATTERNS: Record<ImportFieldKey, RegExp> = {
  rut: /(rut|documento|cedula)/i,
  amount: /(monto|amount|prestamo|capital|valor|importe)/i,
  interest: /(interes|interest|tasa|rate)/i,
  duration: /(plazo|meses|cuotas|duration|periodo)/i,
  date: /(fecha|date|inicio|desembolso|entrega)/i,
  clientName: /(nombre|name|cliente|clienta|deudor|razon)/i,
};

const pad = (value: number) => String(value).padStart(2, '0');

const normalizeText = (value: unknown) => String(value ?? '').trim();

// Windows (Bloc de notas, PowerShell) suele guardar UTF-8 con BOM y eso rompe
// JSON.parse y ensucia el nombre de la primera columna de un CSV.
const stripBom = (value: string) => value.replace(/^\uFEFF/, '');

const buildColumnNames = (header: unknown[]): string[] => {
  const used = new Map<string, number>();

  return header.map((cell, index) => {
    const base = normalizeText(cell) || `Columna ${index + 1}`;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
};

export const autoMapColumns = (columns: string[]): ImportMapping => {
  const mapping: ImportMapping = {
    clientName: '',
    rut: '',
    amount: '',
    interest: '',
    duration: '',
    date: '',
  };

  const used = new Set<number>();
  const order: ImportFieldKey[] = [
    'rut',
    'amount',
    'interest',
    'duration',
    'date',
    'clientName',
  ];

  for (const key of order) {
    const pattern = FIELD_PATTERNS[key];
    for (let index = 0; index < columns.length; index += 1) {
      if (used.has(index)) {
        continue;
      }

      if (pattern.test(columns[index])) {
        mapping[key] = columns[index];
        used.add(index);
        break;
      }
    }
  }

  return mapping;
};

export const parseImportNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  let raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  const negative = raw.startsWith('(') && raw.endsWith(')');
  raw = raw.replace(/[^\d.,-]/g, '');
  if (!raw || raw === '-') {
    return null;
  }

  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else {
      raw = raw.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    const decimals = raw.length - lastComma - 1;
    raw = decimals > 0 && decimals <= 2 ? raw.replace(',', '.') : raw.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const decimals = raw.length - lastDot - 1;
    if (decimals === 3 && /^\d{1,3}(\.\d{3})+$/.test(raw)) {
      raw = raw.replace(/\./g, '');
    }
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return negative ? -parsed : parsed;
};

export const parseImportDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Los seriales de Excel a veces quedan a segundos del dia anterior por
    // redondeo. Si cae casi a medianoche, se ancla al dia siguiente.
    const snapped = new Date(value.getTime());
    if (snapped.getHours() === 23 && snapped.getMinutes() >= 55) {
      snapped.setDate(snapped.getDate() + 1);
      snapped.setHours(0, 0, 0, 0);
    }
    return toLocalDateKey(snapped) ?? todayDateKey();
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      let year = parsed.y;
      let month = parsed.m;
      let day = parsed.d;

      if (parsed.H === 23 && parsed.M >= 55) {
        const next = new Date(Date.UTC(year, month - 1, day + 1));
        year = next.getUTCFullYear();
        month = next.getUTCMonth() + 1;
        day = next.getUTCDate();
      }

      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  const raw = normalizeText(value);
  if (!raw) {
    return todayDateKey();
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
  if (iso) {
    return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  }

  const dayFirst = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(raw);
  if (dayFirst) {
    let year = Number(dayFirst[3]);
    if (year < 100) {
      year += 2000;
    }
    return `${year}-${pad(Number(dayFirst[2]))}-${pad(Number(dayFirst[1]))}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalDateKey(parsed) ?? todayDateKey();
  }

  return todayDateKey();
};

const isPortablePackage = (value: unknown): value is PortableSyncPackage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PortableSyncPackage>;
  return (
    candidate.version === 1 &&
    candidate.source === 'mobiloan-android' &&
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.loans)
  );
};

const groupDigits = (value: number): string => {
  const [intPart, decimalPart] = String(value).split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped}${decimalPart ? `,${decimalPart}` : ''}`;
};

/** Texto corto para mostrar una celda cruda en la vista previa del mapeo. */
export const formatImportCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : parseImportDate(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '';
    }
    return groupDigits(Math.round(value * 100) / 100);
  }

  return normalizeText(value);
};

export const pickImportFile = async (): Promise<PickedImportFile | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/comma-separated-values',
      'application/json',
      '*/*',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.name || 'archivo';
  const lowerName = fileName.toLowerCase();
  const isJson =
    lowerName.endsWith('.json') ||
    asset.mimeType === 'application/json' ||
    asset.mimeType === 'text/json';

  if (isJson) {
    const content = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripBom(content));
    } catch {
      throw new Error('El archivo JSON no contiene datos validos.');
    }

    if (!isPortablePackage(parsed)) {
      throw new Error('El JSON no es un respaldo portable de Mobiloan.');
    }

    return { kind: 'portable', fileName, payload: parsed };
  }

  const isCsv =
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.txt') ||
    asset.mimeType === 'text/csv' ||
    asset.mimeType === 'text/comma-separated-values' ||
    asset.mimeType === 'text/plain';

  let workbook: XLSX.WorkBook;
  try {
    if (isCsv) {
      // Los CSV se leen como texto crudo: si `xlsx` interpreta las celdas,
      // "$750.000" se convierte en 750 y "2026-04-10" en un serial de Excel.
      // El parseo propio (parseImportNumber / parseImportDate) ya cubre ambos.
      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      workbook = XLSX.read(stripBom(content), { type: 'string', raw: true });
    } else {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      workbook = XLSX.read(base64, { type: 'base64', cellDates: true });
    }
  } catch {
    throw new Error('No se pudo leer el archivo. Usa una planilla .xlsx, .xls o .csv.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no contiene hojas de calculo.');
  }

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: true,
  });

  if (!data.length) {
    throw new Error('El archivo no contiene filas para importar.');
  }

  const columns = buildColumnNames(data[0] ?? []);
  const rows = data
    .slice(1)
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => normalizeText(cell) !== ''),
    );

  if (!rows.length) {
    throw new Error('El archivo solo tiene encabezados, no hay datos para importar.');
  }

  return {
    kind: 'sheet',
    fileName,
    columns,
    rows,
    mapping: autoMapColumns(columns),
  };
};

const getRowValue = (
  row: Array<unknown>,
  columns: string[],
  mapping: ImportMapping,
  key: ImportFieldKey,
): unknown => {
  const column = mapping[key];
  if (!column) {
    return null;
  }

  const index = columns.indexOf(column);
  return index >= 0 ? row[index] : null;
};

export const buildSpreadsheetPreview = (
  file: SheetImportFile,
  existingClients: ClientRecord[],
): SpreadsheetPreview => {
  const byRut = new Map<string, string>();
  const byName = new Map<string, string>();
  const existingById = new Map<string, ClientRecord>();

  for (const client of existingClients) {
    existingById.set(client.id, client);

    const rut = normalizeText(client.rut).toLowerCase();
    if (rut) {
      byRut.set(rut, client.id);
    }

    const name = normalizeText(client.name).toLowerCase();
    if (name && !byName.has(name)) {
      byName.set(name, client.id);
    }
  }

  const keyToTemp = new Map<string, string>();
  const clients: PreviewClient[] = [];
  const loans: PreviewLoan[] = [];
  let skippedCount = 0;

  file.rows.forEach((row, index) => {
    const name = normalizeText(getRowValue(row, file.columns, file.mapping, 'clientName'));
    const rut = normalizeText(getRowValue(row, file.columns, file.mapping, 'rut'));
    const amount = parseImportNumber(getRowValue(row, file.columns, file.mapping, 'amount'));

    if (!name || amount === null || amount <= 0) {
      skippedCount += 1;
      return;
    }

    const clientKey = rut.toLowerCase() || name.toLowerCase();
    let clientTempId = keyToTemp.get(clientKey);

    if (!clientTempId) {
      const existingId =
        (rut ? byRut.get(rut.toLowerCase()) : undefined) ??
        byName.get(name.toLowerCase());

      if (existingId) {
        clientTempId = existingId;
        const existingClient = existingById.get(existingId);
        clients.push({
          tempId: existingId,
          name: existingClient?.name ?? name,
          rut: existingClient?.rut ?? rut,
          phone: existingClient?.phone ?? null,
          email: existingClient?.email ?? null,
          address: existingClient?.address ?? null,
          isNew: false,
        });
      } else {
        if (!rut) {
          skippedCount += 1;
          return;
        }

        clientTempId = `import-client-${index}`;
        clients.push({
          tempId: clientTempId,
          name,
          rut,
          phone: null,
          email: null,
          address: null,
          isNew: true,
        });
      }

      keyToTemp.set(clientKey, clientTempId);
    }

    const rawInterest = parseImportNumber(
      getRowValue(row, file.columns, file.mapping, 'interest'),
    );
    const interestRate =
      rawInterest === null
        ? 0.1
        : Math.max(0, rawInterest > 1 ? rawInterest / 100 : rawInterest);

    const rawDuration = parseImportNumber(
      getRowValue(row, file.columns, file.mapping, 'duration'),
    );
    const durationMonths =
      rawDuration === null ? 12 : Math.max(1, Math.floor(rawDuration));

    loans.push({
      clientTempId,
      clientName: name,
      amount,
      interestRate,
      durationMonths,
      startDate: parseImportDate(getRowValue(row, file.columns, file.mapping, 'date')),
    });
  });

  return {
    source: 'spreadsheet',
    fileName: file.fileName,
    clients,
    loans,
    skippedCount,
    totalRows: file.rows.length,
  };
};

export const buildPortablePreview = (file: PortableImportFile): PortablePreview => ({
  source: 'mobiloan-portable',
  fileName: file.fileName,
  payload: file.payload,
  clients: file.payload.clients.length,
  loans: file.payload.loans.length,
  payments: Array.isArray(file.payload.payments) ? file.payload.payments.length : 0,
  paymentTransactions: Array.isArray(file.payload.paymentTransactions)
    ? file.payload.paymentTransactions.length
    : 0,
  pendingOutbox: Array.isArray(file.payload.pendingOutbox)
    ? file.payload.pendingOutbox.length
    : 0,
  exportedAt: file.payload.exportedAt ?? null,
});

export const runSpreadsheetImport = async (
  preview: SpreadsheetPreview,
): Promise<SpreadsheetImportResult> => {
  const idMap = new Map<string, string>();
  const errors: string[] = [];
  let clients = 0;

  for (const client of preview.clients) {
    if (!client.isNew) {
      idMap.set(client.tempId, client.tempId);
      continue;
    }

    try {
      const created = await localDb.createLocalClient({
        name: client.name,
        rut: client.rut || null,
        phone: client.phone ?? null,
        email: client.email ?? null,
        address: client.address ?? null,
      });
      idMap.set(client.tempId, created.id);
      clients += 1;
    } catch (error) {
      errors.push(
        `Cliente ${client.name}: ${
          error instanceof Error ? error.message : 'no se pudo crear'
        }`,
      );
    }
  }

  let loans = 0;
  let failed = 0;

  for (const loan of preview.loans) {
    const clientId = idMap.get(loan.clientTempId);
    if (!clientId) {
      failed += 1;
      errors.push(`${loan.clientName}: no se pudo resolver el cliente.`);
      continue;
    }

    try {
      await localDb.createLocalLoan({
        clientId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        durationMonths: loan.durationMonths,
        startDate: loan.startDate,
        frequency: 'monthly',
        loanType: 'Fixed',
      });
      loans += 1;
    } catch (error) {
      failed += 1;
      errors.push(
        `${loan.clientName}: ${
          error instanceof Error ? error.message : 'no se pudo crear el prestamo'
        }`,
      );
    }
  }

  return {
    clients,
    loans,
    skipped: preview.skippedCount,
    failed,
    errors,
  };
};
