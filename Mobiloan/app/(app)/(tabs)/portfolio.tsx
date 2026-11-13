import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClients, useLoans } from '../../../src/hooks/useOfflineData';
import { APP_THEME } from '../../../src/lib/config';
import { formatCurrency, formatDate } from '../../../src/lib/format';
import { frequencyLabel } from '../../../src/lib/labels';
import { getLoanHealthSummary } from '../../../src/lib/loanHealth';
import type { ClientRecord, LoanListItem } from '../../../src/types/sync';
import {
  EmptyState,
  SectionHeader,
  SegmentedControl,
  TabHeader,
} from '../../../src/ui/components';
import { appStyles } from '../../../src/ui/styles';

type PortfolioMode = 'loans' | 'clients';
type LoanFilter = 'all' | 'active' | 'overdue' | 'paid';

type ClientListItem = ClientRecord & { activeLoanCount: number };

const FILTERS: Array<[LoanFilter, string]> = [
  ['all', 'Todos'],
  ['active', 'Activos'],
  ['overdue', 'Vencidos'],
  ['paid', 'Pagados'],
];

const MODES: Array<{ value: PortfolioMode; label: string }> = [
  { value: 'loans', label: 'Prestamos' },
  { value: 'clients', label: 'Clientes' },
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

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const LoanRow = memo(function LoanRow({ loan }: { loan: LoanListItem }) {
  const health = getLoanHealthSummary(loan);

  return (
    <Pressable
      style={appStyles.compactRow}
      onPress={() => router.push({ pathname: '/(app)/loans/[id]', params: { id: loan.id } })}
    >
      <View style={appStyles.dataRow}>
        <Text style={appStyles.rowStrong} numberOfLines={1}>
          {loan.clientName}
        </Text>
        <View style={[appStyles.chip, { backgroundColor: health.backgroundColor }]}>
          <Text
            style={[appStyles.chipText, { color: health.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {health.label}
          </Text>
        </View>
      </View>
      <Text style={appStyles.rowMeta}>
        {formatCurrency(loan.amount)} · {loan.durationMonths} meses ·{' '}
        {frequencyLabel(loan.frequency)}
      </Text>
      <Text style={appStyles.rowMeta}>
        Saldo {formatCurrency(loan.totalRemaining)}
        {loan.nextDueDate ? ` · proxima ${formatDate(loan.nextDueDate)}` : ''}
      </Text>
      {loan.overdueCount > 0 ? (
        <Text style={[appStyles.rowMeta, { color: '#B91C1C', fontWeight: '700' }]}>
          {loan.overdueCount} vencida{loan.overdueCount === 1 ? '' : 's'} ·{' '}
          {formatCurrency(loan.overdueAmount)}
        </Text>
      ) : (
        <Text style={appStyles.rowMeta}>
          Pagado {formatCurrency(loan.totalPaid)} de {formatCurrency(loan.totalScheduled)}
        </Text>
      )}
    </Pressable>
  );
});

const ClientRow = memo(function ClientRow({ client }: { client: ClientListItem }) {
  return (
    <Pressable
      style={appStyles.compactRow}
      onPress={() =>
        router.push({ pathname: '/(app)/clients/[id]', params: { id: client.id } })
      }
    >
      <View style={appStyles.inlineRow}>
        <View style={appStyles.avatar}>
          <Text style={appStyles.avatarText}>{getInitials(client.name)}</Text>
        </View>
        <View style={appStyles.flexOne}>
          <Text style={appStyles.rowStrong} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={appStyles.rowMeta} numberOfLines={1}>
            {client.rut || 'Sin RUT'} · {client.phone || 'Sin telefono'}
          </Text>
        </View>
        <View style={[appStyles.chip, { backgroundColor: APP_THEME.accentSoft }]}>
          <Text
            style={[appStyles.chipText, { color: APP_THEME.accent }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {client.activeLoanCount} activo{client.activeLoanCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

export default function PortfolioScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [mode, setMode] = useState<PortfolioMode>('loans');
  const [filter, setFilter] = useState<LoanFilter>('all');
  const [search, setSearch] = useState('');
  const loansQuery = useLoans();
  const clientsQuery = useClients(search);
  const loans = loansQuery.data ?? [];
  const clients = clientsQuery.data ?? [];

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
  const isRefreshing = loansQuery.isRefetching || clientsQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([loansQuery.refetch(), clientsQuery.refetch()]);
  };

  const renderLoan = useCallback(
    ({ item }: { item: LoanListItem }) => <LoanRow loan={item} />,
    [],
  );
  const renderClient = useCallback(
    ({ item }: { item: ClientListItem }) => <ClientRow client={item} />,
    [],
  );

  const openNew = () => {
    Alert.alert('Crear registro', 'Que quieres crear?', [
      {
        text: 'Nuevo prestamo',
        onPress: () => router.push('/new-loan'),
      },
      {
        text: 'Nuevo cliente',
        onPress: () => router.push('/new-client'),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const header = (
    <View style={{ gap: 12 }}>
      <TabHeader
        title="Cartera"
        subtitle={`${loans.length} prestamo${loans.length === 1 ? '' : 's'} · ${clients.length} cliente${
          clients.length === 1 ? '' : 's'
        }`}
      />

      <SegmentedControl options={MODES} value={mode} onChange={setMode} />

      <TextInput
        value={search}
        onChangeText={setSearch}
        style={appStyles.input}
        placeholder={
          mode === 'loans' ? 'Buscar por cliente o telefono' : 'Buscar por nombre, RUT o telefono'
        }
        placeholderTextColor="#94A3B8"
      />

      {mode === 'loans' ? (
        <View style={{ gap: 10 }}>
          <View style={appStyles.filterRow}>
            {FILTERS.map(([value, label]) => {
              const active = value === filter;

              return (
                <Pressable
                  key={value}
                  style={[appStyles.filterChip, active && appStyles.filterChipActive]}
                  onPress={() => setFilter(value)}
                >
                  <Text
                    style={[appStyles.filterChipText, active && appStyles.filterChipTextActive]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={appStyles.button}
            onPress={() => router.push('/new-loan')}
          >
            <Text style={appStyles.buttonText}>+ Nuevo prestamo</Text>
          </Pressable>

          <SectionHeader
            title={`${visibleLoans.length} prestamo${visibleLoans.length === 1 ? '' : 's'}`}
            subtitle={`${formatCurrency(totalOutstanding)} por cobrar en este filtro`}
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Pressable
            style={appStyles.button}
            onPress={() => router.push('/new-client')}
          >
            <Text style={appStyles.buttonText}>+ Nuevo cliente</Text>
          </Pressable>
          <SectionHeader
            title={`${clients.length} cliente${clients.length === 1 ? '' : 's'}`}
            subtitle="Toca un cliente para ver su ficha y sus prestamos."
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={appStyles.tabScreen} edges={['top']}>
      {mode === 'loans' ? (
        <FlatList
          data={visibleLoans}
          keyExtractor={(item) => item.id}
          renderItem={renderLoan}
          contentContainerStyle={appStyles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title={search.trim() ? 'Sin resultados' : 'Sin prestamos en este filtro'}
              message={
                search.trim()
                  ? 'No hay prestamos que coincidan con la busqueda.'
                  : 'Crea un prestamo desde una ficha de cliente o con el boton +.'
              }
            />
          }
        />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={appStyles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={search.trim() ? 'Sin resultados' : 'Todavia no hay clientes'}
              message={
                search.trim()
                  ? 'No encontramos clientes con esa busqueda.'
                  : 'Toca + Nuevo cliente para registrar el primero.'
              }
            />
          }
        />
      )}

      {isWide ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear prestamo o cliente"
          style={appStyles.fab}
          onPress={openNew}
        >
          <Ionicons name="add" size={28} color="#F8FDFF" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}
