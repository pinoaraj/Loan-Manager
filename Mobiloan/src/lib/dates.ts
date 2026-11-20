/**
 * Convencion de fechas compartida con el desktop de Loan Manager.
 *
 * El backend guarda las fechas de cuota como "date only" y Prisma las devuelve
 * como `YYYY-MM-DDTHH:mm:ss.000Z` (medianoche UTC). Ese valor NO debe
 * interpretarse como un instante real: en Chile se veria como el dia anterior a
 * las 21:00. Igual que `src/utils/dates.js` en el desktop, aqui se reancla a
 * mediodia local para que el dia calendario nunca se corra.
 */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/;

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

export const parseStoredDate = (value: string | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return isValidDate(value) ? new Date(value.getTime()) : null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(raw)) {
    const [year, month, day] = raw.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const parsed = new Date(raw);
  return isValidDate(parsed) ? parsed : null;
};

/** Devuelve la fecha calendario local (`YYYY-MM-DD`) de un valor guardado. */
export const toLocalDateKey = (value: string | Date | null | undefined): string | null => {
  const date = value instanceof Date ? (isValidDate(value) ? value : null) : parseStoredDate(value);
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayDateKey = () => toLocalDateKey(new Date()) as string;

/** `YYYY-MM-DD` escrito por el usuario, interpretado como fecha local valida. */
export const parseDateInput = (value: string): Date | null => {
  const trimmed = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const isValidDateInput = (value: string) => parseDateInput(value) !== null;

/** Fecha de cuota estable: mediodia local, para que el dia no se corra al serializar. */
export const toStoredDueDate = (date: Date) => {
  const stable = new Date(date.getTime());
  stable.setHours(12, 0, 0, 0);
  return stable.toISOString();
};

export const differenceInDays = (left: Date, right: Date) => {
  const leftKey = new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime();
  const rightKey = new Date(right.getFullYear(), right.getMonth(), right.getDate()).getTime();
  return Math.round((leftKey - rightKey) / 86_400_000);
};
