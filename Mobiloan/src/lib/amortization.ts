import type { LoanFrequency, LoanType, PaymentRecord } from '../types/sync';

const normalizeFrequency = (frequency: LoanFrequency | string = 'monthly') => {
  const normalized = String(frequency).trim().toLowerCase();
  return normalized === 'biweekly' ? 'bi-weekly' : normalized;
};

const buildMonthlySchedule = (
  principal: number,
  monthlyRate: number,
  durationMonths: number,
  startDate: string,
  loanType: LoanType = 'Fixed',
) => {
  const schedule: Array<{
    installment: number;
    dueDate: Date;
    amount: number;
    principal: number;
    interest: number;
    status: PaymentRecord['status'];
  }> = [];
  const start = new Date(startDate);

  if (loanType === 'Fixed') {
    const paymentAmount =
      monthlyRate === 0
        ? principal / durationMonths
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
          (Math.pow(1 + monthlyRate, durationMonths) - 1);

    let remainingPrincipal = principal;

    for (let i = 1; i <= durationMonths; i += 1) {
      const interest = remainingPrincipal * monthlyRate;
      const principalPart = paymentAmount - interest;
      remainingPrincipal -= principalPart;

      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        installment: i,
        dueDate,
        amount: paymentAmount,
        principal: principalPart,
        interest,
        status: 'Pending',
      });
    }
  } else {
    const totalInterest = principal * monthlyRate * durationMonths;
    const totalPayment = principal + totalInterest;
    const paymentAmount = totalPayment / durationMonths;
    const principalPart = principal / durationMonths;
    const interestPart = totalInterest / durationMonths;

    for (let i = 1; i <= durationMonths; i += 1) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        installment: i,
        dueDate,
        amount: paymentAmount,
        principal: principalPart,
        interest: interestPart,
        status: 'Pending',
      });
    }
  }

  return schedule;
};

const splitMonthlySchedule = (
  monthlySchedule: ReturnType<typeof buildMonthlySchedule>,
  startDate: string,
  partsPerMonth: number,
  dayStep: number,
) => {
  const start = new Date(startDate);
  const schedule: ReturnType<typeof buildMonthlySchedule> = [];

  monthlySchedule.forEach((payment, monthIndex) => {
    for (let part = 1; part <= partsPerMonth; part += 1) {
      const installment = monthIndex * partsPerMonth + part;
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + installment * dayStep);

      schedule.push({
        installment,
        dueDate,
        amount: payment.amount / partsPerMonth,
        principal: payment.principal / partsPerMonth,
        interest: payment.interest / partsPerMonth,
        status: payment.status,
      });
    }
  });

  return schedule;
};

export const calculateAmortization = (
  principal: number,
  monthlyRate: number,
  durationMonths: number,
  startDate: string,
  frequency: LoanFrequency | string = 'monthly',
  loanType: LoanType = 'Fixed',
) => {
  const normalizedFrequency = normalizeFrequency(frequency);
  const monthlySchedule = buildMonthlySchedule(
    principal,
    monthlyRate,
    durationMonths,
    startDate,
    loanType,
  );

  switch (normalizedFrequency) {
    case 'weekly':
      return splitMonthlySchedule(monthlySchedule, startDate, 4, 7);
    case 'bi-weekly':
      return splitMonthlySchedule(monthlySchedule, startDate, 2, 14);
    case 'monthly':
    default:
      return monthlySchedule;
  }
};
