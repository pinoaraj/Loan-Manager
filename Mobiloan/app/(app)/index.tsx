import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useClients,
  useDashboardStats,
  useLoans,
} from '../../src/hooks/useOfflineData';
import { formatCurrency, formatDate, getRelativeDueLabel } from '../../src/lib/format';
import { getLoanHealthSummary } from '../../src/lib/loanHealth';
import { useSession } from '../../src/providers/AppProviders';
import { appStyles } from '../../src/ui/styles';

export default function PortfolioScreen() {
  const [search, setSearch] = useState('');
  const { session } = useSession();
  const statsQuery = useDashboardStats();
  const loansQuery = useLoans();
  const clientsQuery = useClients(search);

  const stats = statsQuery.data;
  const loans = loansQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const activeLoans = loans.filter((loan) => loan.status !== 'Paid').slice(0, 4);
  const isRefreshing =
    statsQuery.isRefetching || loansQuery.isRefetching || clientsQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([statsQuery.refetch(), loansQuery.refetch(), clientsQuery.refetch()]);
  };

  return (
    <ScrollView
      style={appStyles.screen}
      contentContainerStyle={appStyles.scroll}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
    >
      <View style={appStyles.heroCard}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.heroTitle}>
              Hola, {session?.username || 'cobrador'}
            </Text>
            <Text style={appStyles.heroSubtitle}>
              Tu cartera vive en este telefono. Cobra, registra pagos y revisa tus numeros
              sin depender de nada mas.
            </Text>
          </View>
          <Pressable
            style={appStyles.heroAction}
            onPress={() => router.push('/(app)/settings' as never)}
          >
            <Text style={appStyles.heroActionText}>Ajustes</Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.statGrid}>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Capital prestado</Text>
          <Text style={appStyles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totalLent ?? 0)}
          </Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Por cobrar</Text>
          <Text style={appStyles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totalOutstanding ?? 0)}
          </Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Cobrado</Text>
          <Text style={appStyles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totalCollected ?? 0)}
          </Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Salud de cartera</Text>
          <Text style={appStyles.statValue}>{stats?.healthScore ?? 100}%</Text>
        </View>
      </View>

      {(stats?.overduePayments ?? 0) > 0 ? (
        <Pressable
          style={appStyles.alertCard}
          onPress={() => router.push('/(app)/collections' as never)}
        >
          <Text style={appStyles.alertTitle}>
            {stats?.overduePayments} cuota{(stats?.overduePayments ?? 0) === 1 ? '' : 's'} vencida
            {(stats?.overduePayments ?? 0) === 1 ? '' : 's'}
          </Text>
          <Text style={appStyles.alertText}>
            Tienes {formatCurrency(stats?.overdueAmount ?? 0)} por recuperar. Toca aqui para abrir
            la cobranza y contactar a los clientes.
          </Text>
        </Pressable>
      ) : (
        <View style={appStyles.card}>
          <Text style={appStyles.cardTitle}>Cartera al dia</Text>
          <Text style={appStyles.cardSubtitle}>
            No hay cuotas vencidas pendientes. Sigue registrando pagos para mantener el ritmo.
          </Text>
        </View>
      )}

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Acciones rapidas</Text>
        <View style={appStyles.actionRow}>
          <Pressable
            style={appStyles.button}
            onPress={() => router.push('/(app)/new-client' as never)}
          >
            <Text style={appStyles.buttonText}>Nuevo cliente</Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => router.push('/(app)/new-loan' as never)}
          >
            <Text style={appStyles.buttonMutedText}>Nuevo prestamo</Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => router.push('/(app)/collections' as never)}
          >
            <Text style={appStyles.buttonMutedText}>Cobranza</Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => router.push('/(app)/loans' as never)}
          >
            <Text style={appStyles.buttonMutedText}>Prestamos</Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => router.push('/(app)/calculator' as never)}
          >
            <Text style={appStyles.buttonMutedText}>Calculadora</Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Prestamos en curso</Text>
            <Text style={appStyles.cardSubtitle}>
              {activeLoans.length > 0
                ? 'Los que hoy necesitan seguimiento.'
                : 'Aun no hay prestamos activos.'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/loans' as never)}>
            <Text style={appStyles.linkText}>Ver todos</Text>
          </Pressable>
        </View>

        {activeLoans.map((loan) => {
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
                  <Text style={[appStyles.chipText, { color: health.color }]}>{health.label}</Text>
                </View>
              </View>
              <Text style={appStyles.itemText}>
                {formatCurrency(loan.amount)} - {loan.durationMonths} meses -{' '}
                {loan.frequency === 'monthly'
                  ? 'mensual'
                  : loan.frequency === 'bi-weekly'
                    ? 'quincenal'
                    : 'semanal'}
              </Text>
              <Text style={appStyles.itemText}>
                Saldo: {formatCurrency(loan.totalRemaining)}
                {loan.nextDueDate ? ` - Proxima cuota: ${formatDate(loan.nextDueDate)}` : ''}
              </Text>
              {loan.overdueCount > 0 ? (
                <Text style={[appStyles.itemText, { color: '#B91C1C' }]}>
                  {loan.overdueCount} cuota{loan.overdueCount === 1 ? '' : 's'} vencida
                  {loan.overdueCount === 1 ? '' : 's'} - {formatCurrency(loan.overdueAmount)}
                </Text>
              ) : (
                <Text style={appStyles.itemText}>
                  {loan.nextDueDate ? getRelativeDueLabel(loan.nextDueDate) : 'Sin cuotas pendientes'}
                </Text>
              )}
            </Pressable>
          );
        })}

        {activeLoans.length === 0 ? (
          <Text style={appStyles.emptyState}>
            Crea un cliente y luego su primer prestamo para empezar a cobrar.
          </Text>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <Text style={appStyles.cardTitle}>Clientes</Text>
          <Text style={appStyles.cardSubtitle}>{clients.length}</Text>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={appStyles.input}
          placeholder="Buscar por nombre, RUT o telefono"
          placeholderTextColor="#94A3B8"
        />

        {clients.map((client) => (
          <Pressable
            key={client.id}
            style={appStyles.listItem}
            onPress={() =>
              router.push({ pathname: '/(app)/clients/[id]', params: { id: client.id } })
            }
          >
            <Text style={appStyles.itemTitle}>{client.name}</Text>
            <Text style={appStyles.itemText}>
              {client.rut || 'Sin RUT'} - {client.phone || 'Sin telefono'}
            </Text>
            <Text style={appStyles.itemText}>
              Prestamos activos: {client.activeLoanCount}
            </Text>
          </Pressable>
        ))}

        {clients.length === 0 ? (
          <Text style={appStyles.emptyState}>
            {search.trim()
              ? 'No encontramos clientes con esa busqueda.'
              : 'Todavia no hay clientes. Toca "Nuevo cliente" para crear el primero.'}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
