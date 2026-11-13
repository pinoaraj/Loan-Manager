const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const frequencyLabel = (frequency?: string | null): string => {
  switch (normalize(frequency)) {
    case 'weekly':
      return 'Semanal';
    case 'bi-weekly':
    case 'biweekly':
    case 'quincenal':
      return 'Quincenal';
    case 'monthly':
    case 'mensual':
      return 'Mensual';
    default:
      return frequency?.trim() || 'Mensual';
  }
};

export const loanTypeLabel = (loanType?: string | null): string => {
  switch (normalize(loanType)) {
    case 'fixed':
      return 'Cuota fija';
    case 'simple':
      return 'Interes simple';
    default:
      return loanType?.trim() || 'Cuota fija';
  }
};

export const paymentStatusLabel = (status?: string | null): string => {
  switch (normalize(status)) {
    case 'paid':
      return 'Pagada';
    case 'partial':
      return 'Parcial';
    case 'overdue':
      return 'Vencida';
    case 'pending':
      return 'Pendiente';
    default:
      return status?.trim() || 'Pendiente';
  }
};

export const paymentMethodLabel = (method?: string | null): string => {
  switch (normalize(method)) {
    case 'cash':
    case 'efectivo':
      return 'Efectivo';
    case 'transfer':
    case 'transferencia':
      return 'Transferencia';
    default:
      return method?.trim() || 'Efectivo';
  }
};

export const loanStatusLabel = (status?: string | null): string => {
  switch (normalize(status)) {
    case 'active':
      return 'Activo';
    case 'paid':
      return 'Pagado';
    case 'overdue':
      return 'Vencido';
    case 'closed':
      return 'Cerrado';
    default:
      return status?.trim() || 'Activo';
  }
};
