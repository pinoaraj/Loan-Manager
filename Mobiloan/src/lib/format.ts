export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin sincronizacion';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getRelativeDueLabel = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin fecha';
  }

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) {
    return value;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays === 0) {
    return 'Vence hoy';
  }

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return daysLate === 1 ? 'Atraso de 1 dia' : `Atraso de ${daysLate} dias`;
  }

  return diffDays === 1 ? 'Vence manana' : `Vence en ${diffDays} dias`;
};
