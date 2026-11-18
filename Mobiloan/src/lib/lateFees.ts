import { differenceInDays, parseStoredDate } from './dates';
import { formatCurrency } from './format';

import type { LateFeeType } from '../types/sync';

export interface LateFeePolicy {
  graceDays: number;
  lateFeeType: LateFeeType;
  lateFeeValue: number;
}

export const DEFAULT_LATE_FEE_POLICY: LateFeePolicy = {
  graceDays: 3,
  lateFeeType: 'Fixed',
  lateFeeValue: 0,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Normaliza la politica de mora guardada. Los prestamos que vienen del
 * desktop o de versiones anteriores pueden no traer los campos, por eso se
 * completan con los mismos defaults del escritorio (`3`, `Fixed`, `0`).
 */
export const resolveLateFeePolicy = (
  loan:
    | {
        graceDays?: number | null;
        lateFeeType?: string | null;
        lateFeeValue?: number | null;
      }
    | null
    | undefined,
): LateFeePolicy => {
  const rawGraceDays = Number(loan?.graceDays);
  const graceDays = Number.isFinite(rawGraceDays)
    ? Math.max(0, Math.floor(rawGraceDays))
    : DEFAULT_LATE_FEE_POLICY.graceDays;

  const lateFeeType: LateFeeType = loan?.lateFeeType === 'Percent' ? 'Percent' : 'Fixed';
  const rawValue = Number(loan?.lateFeeValue);
  const lateFeeValue = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;

  return { graceDays, lateFeeType, lateFeeValue };
};

/** Monto de mora que corresponde a una cuota, segun la politica del prestamo. */
export const calculateLateFee = (amount: number, policy: LateFeePolicy): number => {
  if (!Number.isFinite(amount) || amount <= 0 || policy.lateFeeValue <= 0) {
    return 0;
  }

  const fee =
    policy.lateFeeType === 'Percent'
      ? amount * policy.lateFeeValue
      : policy.lateFeeValue;

  return round2(Math.max(fee, 0));
};

/** El atraso supera los dias de gracia (sin importar si hay monto de mora). */
export const isPastGracePeriod = (
  dueDate: string,
  policy: LateFeePolicy,
  today: Date = new Date(),
): boolean => {
  const due = parseStoredDate(dueDate);
  if (!due) {
    return false;
  }

  return differenceInDays(today, due) > policy.graceDays;
};

/** La mora se aplica recien cuando el atraso supera los dias de gracia. */
export const isLateFeeDue = (
  dueDate: string,
  policy: LateFeePolicy,
  today: Date = new Date(),
): boolean => {
  if (policy.lateFeeValue <= 0) {
    return false;
  }

  return isPastGracePeriod(dueDate, policy, today);
};

export const formatLateFeePercent = (rate: number) =>
  `${(Number.isFinite(rate) ? rate * 100 : 0).toFixed(2).replace('.', ',')}%`;

/** Texto corto para listas y resumenes: "$2.000 por cuota" o "5,00% de la cuota". */
export const lateFeePolicyLabel = (policy: LateFeePolicy): string => {
  if (policy.lateFeeValue <= 0) {
    return 'Sin mora';
  }

  return policy.lateFeeType === 'Percent'
    ? `${formatLateFeePercent(policy.lateFeeValue)} de la cuota`
    : `${formatCurrency(policy.lateFeeValue)} por cuota`;
};

/** Explicacion completa para la ficha del prestamo. */
export const lateFeePolicyDescription = (policy: LateFeePolicy): string => {
  if (policy.lateFeeValue <= 0) {
    return 'Sin mora configurada para este prestamo.';
  }

  const grace =
    policy.graceDays === 1
      ? '1 dia de gracia'
      : `${policy.graceDays} dias de gracia`;

  return `${lateFeePolicyLabel(policy)}, despues de ${grace}.`;
};
