import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useLoans } from '../../../src/hooks/useOfflineData';
import { formatCurrency, formatDate } from '../../../src/lib/format';
import { getLoanHealthSummary } from '../../../src/lib/loanHealth';
import { appStyles } from '../../../src/ui/styles';
import type { LoanListItem } from '../../../src/types/sync';

type LoanFilter = 'all' | 'active' | 'overdue' | 'paid';

const FILTERS: Array<[LoanFilter, string]> = [
  ['all', 'Todos'],
  ['active', 'Activos'],
  ['overdue', 'Vencidos'],
  ['paid', 'Pagados'],
];

const matchesFilter = (loan: LoanListItem, filter: LoanFilter) => {
  if (filter === 'paid') {
    return loan.status === 'Paid';
  }

  if (filter === 'overdue') {
    return loan.status !== 'Paid' && loan.overdueCount > 0;
  }

  if (filter === 'active') {
    return loan.status !== 'Paid';
  }

  return true;
};

export default function LoansScreen() {
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [search, setSearch] = useState('');
  const loansQuery = useLoans();
  const loans = loansQuery.data ?? [];

  const visibleLoans = useMemo(() => {
    const term = search.trim().toLowerCase();

    return loans
      .filter((loan) => matchesFilter(loan, filter))
      .filter((loan) =>
        term
          ? loan.clientName.toLowerCase().includes(term) ||
            (loan.clientPhone ?? '').toLowerCase().includes(term)
          : true,
      );
  }, [filter, loans, search]);

  const totalOutstanding = visibleLoans.reduce((sum, loan) => sum + loan.totalRemaining, 0);

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Prestamos</Text>
        <Text style={appStyles.heroSubtitle}>
          {visibleLoans.length} prestamo{visibleLoans.length === 1 ? '' : 's'} -{' '}
          {formatCurrency(totalOutstanding)} por cobrar
        </Text>
      </View>

      <View style={appStyles.card}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={appStyles.input}
          placeholder="Buscar por cliente o telefono"
          placeholderTextColor="#94A3B8"
        />
        <View style={appStyles.actionRow}>
          {FILTERS.map(([value, label]) => (
            <Pressable
              key={value}
              style={value === filter ? appStyles.button : appStyles.buttonMuted}
              onPress={() => setFilter(value)}
            >
              <Text
                style={value === filter ? appStyles.buttonText : appStyles.buttonMutedText}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={appStyles.card}>
        {visibleLoans.map((loan) => {
          const health = getLoanHealthSummary(loan);

          return (
            <Pressable
              key={loan.id}
              style={appStyles.listItem}
              onPress={() =>
                router.push({ pathname: '/(app)/loans/[id]', params: { id: loan.id } })
              }
            >
              <View style={appStyles.rowBetween}>
                <Text style={appStyles.itemTitle}>{loan.clientName}</Text>
                <View style={[appStyles.chip, { backgroundColor: health.backgroundColor }]}>
                  <Text style={[appStyles.chipText, { color: health.color }]}>
                    {health.label}
                  </Text>
                </View>
              </View>
              <Text style={appStyles.itemText}>
                {formatCurrency(loan.amount)} - {loan.durationMonths} meses
              </Text>
              <Text style={appStyles.itemText}>
                Pagado: {formatCurrency(loan.totalPaid)} de {formatCurrency(loan.totalScheduled)}
              </Text>
              <Text style={appStyles.itemText}>
                Saldo: {formatCurrency(loan.totalRemaining)}
                {loan.nextDueDate ? ` - Proxima: ${formatDate(loan.nextDueDate)}` : ''}
              </Text>
              {loan.overdueCount > 0 ? (
                <Text style={[appStyles.itemText, { color: '#B91C1C' }]}>
                  {loan.overdueCount} vencida{loan.overdueCount === 1 ? '' : 's'} -{' '}
                  {formatCurrency(loan.overdueAmount)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        {visibleLoans.length === 0 ? (
          <Text style={appStyles.emptyState}>
            {search.trim()
              ? 'No hay prestamos que coincidan con la busqueda.'
              : 'No hay prestamos en este filtro. Crea uno desde la ficha de un cliente.'}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
