import { differenceInDays, parseStoredDate } from './dates';

import type { LoanRecord, PaymentRecord } from '../types/sync';

export type LoanHealthStatus = 'PAUSADA' | 'PAGADO' | 'MOROSO' | 'ATRASADO' | 'AL_DIA';

export interface LoanHealth {
  status: LoanHealthStatus;
  label: string;
  color: string;
  backgroundColor: string;
  description: string;
}

/**
 * Misma regla que `src/hooks/useLoanHealth.js` del desktop:
 * pausada -> pagado -> moroso (>=30 dias) -> atrasado (1-29) -> al dia.
 */
export const getLoanHealthSummary = (loan: {
  isPaused: boolean;
  status: LoanRecord['status'];
  overdueCount: number;
  maxDaysLate: number;
}): LoanHealth => {
  if (loan.isPaused) {
    return {
      status: 'PAUSADA',
      label: 'PAUSADA',
      color: '#334155',
      backgroundColor: '#E2E8F0',
      description: 'La deuda esta pausada administrativamente.',
    };
  }

  if (loan.status === 'Paid') {
    return {
      status: 'PAGADO',
      label: 'PAGADO',
      color: '#047857',
      backgroundColor: '#D1FAE5',
      description: 'El prestamo fue pagado en su totalidad.',
    };
  }

  if (loan.overdueCount === 0) {
    return {
      status: 'AL_DIA',
      label: 'AL DIA',
      color: '#047857',
      backgroundColor: '#D1FAE5',
      description: 'El cliente esta al dia con sus pagos.',
    };
  }

  if (loan.maxDaysLate >= 30) {
    return {
      status: 'MOROSO',
      label: 'MOROSO',
      color: '#BE123C',
      backgroundColor: '#FFE4E6',
      description: `Cliente moroso con ${loan.maxDaysLate} dias de atraso.`,
    };
  }

  return {
    status: 'ATRASADO',
    label: 'ATRASADO',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    description: `Cliente atrasado con ${loan.maxDaysLate} dias de atraso.`,
  };
};

export const getLoanHealth = (
  loan: Pick<LoanRecord, 'isPaused' | 'status'>,
  payments: Array<Pick<PaymentRecord, 'status' | 'dueDate'>>,
): LoanHealth => {
  const today = new Date();
  let maxDaysLate = 0;
  let overdueCount = 0;

  for (const payment of payments) {
    if (payment.status === 'Paid') {
      continue;
    }

    const dueDate = parseStoredDate(payment.dueDate);
    if (!dueDate) {
      continue;
    }

    const daysLate = differenceInDays(today, dueDate);
    if (daysLate > 0) {
      overdueCount += 1;
      if (daysLate > maxDaysLate) {
        maxDaysLate = daysLate;
      }
    }
  }

  return getLoanHealthSummary({ ...loan, overdueCount, maxDaysLate });
};
