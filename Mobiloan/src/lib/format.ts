import { differenceInDays, parseStoredDate } from './dates';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = parseStoredDate(value);
  if (!date) {
    return typeof value === 'string' ? value : 'Sin fecha';
  }

  return DATE_FORMATTER.format(date);
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin sincronizacion';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return DATE_TIME_FORMATTER.format(date);
};

export const getRelativeDueLabel = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin fecha';
  }

  const targetDate = parseStoredDate(value);
  if (!targetDate) {
    return value;
  }

  const diffDays = differenceInDays(targetDate, new Date());

  if (diffDays === 0) {
    return 'Vence hoy';
  }

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return daysLate === 1 ? 'Atraso de 1 dia' : `Atraso de ${daysLate} dias`;
  }

  return diffDays === 1 ? 'Vence manana' : `Vence en ${diffDays} dias`;
};
