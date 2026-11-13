import { calculateAmortization } from './amortization';
import { parseStoredDate } from './dates';

import type { LoanRecord, PaymentRecord } from '../types/sync';

export interface InstallmentRow {
  payment: PaymentRecord;
  /** Numero de cuota dentro del calendario (1-based). */
  index: number;
  principal: number;
  interest: number;
  lateFee: number;
  totalDue: number;
  paid: number;
  remaining: number;
  /** 0..1 segun lo pagado sobre el total de la cuota. */
  progress: number;
  /** Lo que aun se debe desde esta cuota hasta el final del prestamo. */
  balance: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Alinea las cuotas guardadas con el calendario de amortizacion del prestamo
 * para poder mostrar capital e interes de cada fila sin migrar la base local.
 *
 * Las cuotas se crean con `calculateAmortization`, asi que el reparto calza
 * 1:1. Si un prestamo llego del desktop con montos distintos, el reparto se
 * escala al monto guardado para que capital + interes siempre sume la cuota.
 */
export const buildInstallmentRows = (
  loan: Pick<
    LoanRecord,
    'amount' | 'interestRate' | 'durationMonths' | 'startDate' | 'frequency' | 'loanType'
  >,
  payments: PaymentRecord[],
): InstallmentRow[] => {
  const sorted = [...payments].sort((left, right) => {
    const leftDate = parseStoredDate(left.dueDate);
    const rightDate = parseStoredDate(right.dueDate);
    return (leftDate?.getTime() ?? 0) - (rightDate?.getTime() ?? 0);
  });

  const schedule = calculateAmortization(
    loan.amount,
    loan.interestRate,
    loan.durationMonths,
    loan.startDate,
    loan.frequency,
    loan.loanType,
  );

  const rows = sorted.map((payment, position) => {
    const planned = schedule[position];
    const totalDue = round2(payment.amount + payment.lateFee);
    const paid = round2(payment.paidAmount);
    const remaining = round2(Math.max(totalDue - paid, 0));

    let principal: number;
    let interest: number;

    if (planned && planned.amount > 0) {
      const scale = payment.amount / planned.amount;
      principal = round2(planned.principal * scale);
      interest = round2(payment.amount - principal);
    } else {
      principal = round2(payment.amount);
      interest = 0;
    }

    return {
      payment,
      index: position + 1,
      principal,
      interest,
      lateFee: round2(payment.lateFee),
      totalDue,
      paid,
      remaining,
      progress: totalDue > 0 ? Math.min(paid / totalDue, 1) : 0,
      balance: 0,
    };
  });

  let running = 0;
  for (let position = rows.length - 1; position >= 0; position -= 1) {
    running = round2(running + rows[position].remaining);
    rows[position].balance = running;
  }

  return rows;
};
