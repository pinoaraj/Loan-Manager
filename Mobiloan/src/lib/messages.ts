/**
 * Textos de comunicacion con el cliente.
 *
 * Replica `getReminderMessage` / `getReceiptMessage` del desktop
 * (`src/utils/communication.js`) para que el mensaje que se envia por WhatsApp
 * desde el telefono sea identico al que se envia desde el PC.
 */

import { parseStoredDate } from './dates';

const formatAmount = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatLongDate = (value: string | null | undefined) => {
  const date = parseStoredDate(value ?? null);
  if (!date) {
    return 'sin fecha';
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
  }).format(date);
};

export const getReceiptMessage = (clientName: string, amount: number, date: string) =>
  `*COMPROBANTE DE PAGO*\n\nHola *${clientName}*,\n\nConfirmamos que hemos recibido satisfactoriamente su pago de *$${formatAmount(
    amount,
  )}* el dia ${date}.\n\nSu saldo ha sido actualizado en el sistema. Gracias por su puntualidad.`;

export const getReminderMessage = (
  clientName: string,
  amount: number,
  dueDate: string | null | undefined,
  type: 'overdue' | 'upcoming' = 'upcoming',
  context: { paymentNumber?: number; totalPayments?: number } = {},
) => {
  const formattedDate = formatLongDate(dueDate);
  const paymentContext =
    context.paymentNumber && context.totalPayments
      ? `\nCuota: *${context.paymentNumber} de ${context.totalPayments}*`
      : '';

  if (type === 'overdue') {
    return `*AVISO DE PAGO VENCIDO*\n\nHola *${clientName}*,\n\nLe informamos que su cuota de *$${formatAmount(
      amount,
    )}* con vencimiento el ${formattedDate} se encuentra *vencida*.${paymentContext}\n\nPor favor, regularice su situacion lo antes posible para evitar recargos adicionales. Si ya realizo el pago, por favor ignore este mensaje.`;
  }

  return `*RECORDATORIO DE PAGO*\n\nHola *${clientName}*,\n\nLe recordamos que su proxima cuota de *$${formatAmount(
    amount,
  )}* vence el dia *${formattedDate}*.${paymentContext}\n\nQuedamos a su disposicion para cualquier consulta.`;
};
