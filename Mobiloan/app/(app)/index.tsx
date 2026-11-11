import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useClients,
  useCollectionProjections,
  useDashboardStats,
  useLoans,
  usePaymentAlerts,
  useRecentActivity,
} from '../../src/hooks/useOfflineData';
import { createCollectionReminder } from '../../src/lib/calendar';
import { openWhatsApp } from '../../src/lib/contact';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getRelativeDueLabel,
} from '../../src/lib/format';
import { getLoanHealthSummary } from '../../src/lib/loanHealth';
import { getReminderMessage } from '../../src/lib/messages';
import { useSession } from '../../src/providers/AppProviders';
import type { PaymentAlertItem } from '../../src/types/sync';
import { appStyles } from '../../src/ui/styles';

export default function PortfolioScreen() {
  const [search, setSearch] = useState('');
  const { session } = useSession();
  const statsQuery = useDashboardStats();
  const loansQuery = useLoans();
  const clientsQuery = useClients(search);
  const alertsQuery = usePaymentAlerts(6);
  const activityQuery = useRecentActivity(5);
  const projectionsQuery = useCollectionProjections(6);

  const stats = statsQuery.data;
  const loans = loansQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const projections = projectionsQuery.data ?? [];
  const activeLoans = loans.filter((loan) => loan.status !== 'Paid').slice(0, 4);
  const maxProjection = projections.reduce((max, point) => Math.max(max, point.amount), 0) || 1;
  const portfolioSegments = [
    { label: 'Activos', value: stats?.activeLoans ?? 0, color: '#2DD4BF' },
    { label: 'Vencidos', value: stats?.overdueLoans ?? 0, color: '#FB7185' },
    { label: 'Pagados', value: stats?.paidLoans ?? 0, color: '#8B5CF6' },
    { label: 'Pausados', value: stats?.pausedLoans ?? 0, color: '#F472B6' },
  ];
  const portfolioTotal = portfolioSegments.reduce((sum, item) => sum + item.value, 0);
  const collectionProgress =
    (stats?.expectedCollection ?? 0) > 0
      ? Math.round(((stats?.monthlyCollection ?? 0) / (stats?.expectedCollection ?? 1)) * 100)
      : 0;
  const isRefreshing =
    statsQuery.isRefetching ||
    loansQuery.isRefetching ||
    clientsQuery.isRefetching ||
    alertsQuery.isRefetching ||
    activityQuery.isRefetching ||
    projectionsQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([
      statsQuery.refetch(),
      loansQuery.refetch(),
      clientsQuery.refetch(),
      alertsQuery.refetch(),
      activityQuery.refetch(),
      projectionsQuery.refetch(),
    ]);
  };

  const handleAlertWhatsApp = async (alert: PaymentAlertItem) => {
    try {
      const message = getReminderMessage(
        alert.clientName,
        alert.amount,
        alert.dueDate,
        alert.type,
      );
      await openWhatsApp(alert.clientPhone, message);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir WhatsApp',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  };

  const handleAlertReminder = async (alert: PaymentAlertItem) => {
    try {
      await createCollectionReminder({
        clientName: alert.clientName,
        clientPhone: alert.clientPhone,
        paymentId: alert.paymentId,
        loanId: alert.loanId,
        amount: alert.amount,
        dueDate: alert.dueDate,
        installmentLabel: `cuota ${formatDate(alert.dueDate)}`,
      });
      Alert.alert('Recordatorio creado', 'La cobranza quedo guardada en el calendario del telefono.');
    } catch (error) {
      Alert.alert(
        'No se pudo crear el recordatorio',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  };

  const openPayment = (loanId: string, paymentId?: string) =>
    router.push({
      pathname: '/(app)/loans/[id]',
      params: paymentId ? { id: loanId, paymentId } : { id: loanId },
    });

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
          <Text style={appStyles.statLabel}>Total prestado</Text>
          <Text style={appStyles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.totalLent ?? 0)}
          </Text>
          <Text style={appStyles.statSubtext}>
            {formatCurrency(stats?.parAmount ?? 0)} en cuotas con riesgo
          </Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Cobranza mensual</Text>
          <Text style={appStyles.statValueSmall} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(stats?.monthlyCollection ?? 0)}
          </Text>
          <Text style={appStyles.statSubtext}>
            {collectionProgress}% de la meta ({formatCurrency(stats?.expectedCollection ?? 0)})
          </Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Clientes activos</Text>
          <Text style={appStyles.statValue}>{stats?.totalClients ?? 0}</Text>
          <Text style={appStyles.statSubtext}>Total de prestatarios unicos</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Salud de cartera</Text>
          <Text style={appStyles.statValue}>{stats?.healthScore ?? 100}%</Text>
          <Text style={appStyles.statSubtext}>Prestamos al dia</Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Estado de cartera</Text>
            <Text style={appStyles.cardSubtitle}>Distribucion de tus prestamos.</Text>
          </View>
          <Text style={appStyles.statValue}>{portfolioTotal}</Text>
        </View>

        {portfolioTotal > 0 ? (
          <View style={appStyles.segmentBar}>
            {portfolioSegments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <View
                  key={segment.label}
                  style={[
                    appStyles.segment,
                    { flex: segment.value, backgroundColor: segment.color },
                  ]}
                />
              ))}
          </View>
        ) : (
          <Text style={appStyles.emptyState}>Aun no hay prestamos registrados.</Text>
        )}

        <View style={appStyles.legendRow}>
          {portfolioSegments.map((segment) => (
            <View key={segment.label} style={appStyles.legendItem}>
              <View style={[appStyles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={appStyles.legendText}>
                {segment.label}: {segment.value}
              </Text>
            </View>
          ))}
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
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Alertas de pago</Text>
            <Text style={appStyles.cardSubtitle}>
              Cuotas vencidas y las que vencen en los proximos 30 dias.
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/collections' as never)}>
            <Text style={appStyles.linkText}>Ver cobranza</Text>
          </Pressable>
        </View>

        {alerts.length === 0 ? (
          <Text style={appStyles.emptyState}>No hay alertas pendientes.</Text>
        ) : (
          alerts.slice(0, 4).map((alert) => {
            const isOverdue = alert.type === 'overdue';
            const accent = isOverdue ? '#B91C1C' : '#B45309';

            return (
              <View key={alert.paymentId} style={appStyles.listItemMuted}>
                <Pressable onPress={() => openPayment(alert.loanId, alert.paymentId)}>
                  <View style={appStyles.rowBetween}>
                    <Text style={appStyles.itemTitle}>{alert.clientName}</Text>
                    <Text style={[appStyles.statValueSmall, { color: accent }]}>
                      {formatCurrency(alert.amount)}
                    </Text>
                  </View>
                  <Text style={[appStyles.itemText, { color: accent, fontWeight: '700' }]}>
                    {isOverdue
                      ? `Vencio hace ${alert.daysOverdue} dia${alert.daysOverdue === 1 ? '' : 's'}`
                      : alert.daysUntil === 0
                        ? 'Vence hoy'
                        : `Vence en ${alert.daysUntil} dia${alert.daysUntil === 1 ? '' : 's'}`}
                  </Text>
                  <Text style={appStyles.itemText}>{formatDate(alert.dueDate)}</Text>
                </Pressable>

                <View style={appStyles.actionRow}>
                  <Pressable
                    style={appStyles.buttonMuted}
                    onPress={() => handleAlertWhatsApp(alert)}
                  >
                    <Text style={appStyles.buttonMutedText}>WhatsApp</Text>
                  </Pressable>
                  <Pressable
                    style={appStyles.buttonMuted}
                    onPress={() => handleAlertReminder(alert)}
                  >
                    <Text style={appStyles.buttonMutedText}>Calendario</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Proyeccion de cobranza</Text>
        <Text style={appStyles.cardSubtitle}>
          Lo que deberias recaudar en los proximos 6 meses.
        </Text>

        {projections.length === 0 ? (
          <Text style={appStyles.emptyState}>No hay cuotas futuras programadas.</Text>
        ) : (
          <View style={appStyles.chartRow}>
            {projections.map((point) => (
              <View key={point.monthKey} style={appStyles.chartColumn}>
                <Text style={appStyles.chartValue}>{formatCompactCurrency(point.amount)}</Text>
                <View style={appStyles.chartTrack}>
                  <View
                    style={[
                      appStyles.chartFill,
                      { height: `${Math.max(Math.round((point.amount / maxProjection) * 100), 6)}%` },
                    ]}
                  />
                </View>
                <Text style={appStyles.chartLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

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
        <Text style={appStyles.cardTitle}>Actividad reciente</Text>
        <Text style={appStyles.cardSubtitle}>Los ultimos pagos registrados en el telefono.</Text>

        {activity.length === 0 ? (
          <Text style={appStyles.emptyState}>Todavia no hay pagos registrados.</Text>
        ) : (
          activity.map((item) => (
            <Pressable
              key={item.id}
              style={appStyles.listItemMuted}
              onPress={() => openPayment(item.loanId)}
            >
              <View style={appStyles.rowBetween}>
                <Text style={appStyles.itemTitle}>{item.clientName}</Text>
                <Text style={appStyles.activityAmount}>+{formatCurrency(item.amount)}</Text>
              </View>
              <Text style={appStyles.itemText}>
                {formatDate(item.date)} - {item.method}
              </Text>
              {item.note ? <Text style={appStyles.itemText}>{item.note}</Text> : null}
            </Pressable>
          ))
        )}
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
