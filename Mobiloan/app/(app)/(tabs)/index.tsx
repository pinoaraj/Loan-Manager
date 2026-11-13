import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboardStats, usePaymentAlerts } from '../../../src/hooks/useOfflineData';
import { createCollectionReminder } from '../../../src/lib/calendar';
import { APP_THEME } from '../../../src/lib/config';
import { openWhatsApp } from '../../../src/lib/contact';
import { formatCompactCurrency, formatCurrency, formatDate } from '../../../src/lib/format';
import { getReminderMessage } from '../../../src/lib/messages';
import { useSession } from '../../../src/providers/AppProviders';
import type { PaymentAlertItem } from '../../../src/types/sync';
import {
  EmptyState,
  KpiCard,
  QuickAction,
  SectionHeader,
  TabHeader,
} from '../../../src/ui/components';
import type { IconName } from '../../../src/ui/components';
import { appStyles } from '../../../src/ui/styles';

type KpiItem = {
  key: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'danger' | 'success';
  icon: IconName;
  iconColor: string;
  iconBackground: string;
};

const go = (path: Href) => router.push(path);

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const todayLabel = capitalize(
  new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date()),
);

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const { session } = useSession();
  const statsQuery = useDashboardStats();
  const alertsQuery = usePaymentAlerts(12);

  const stats = statsQuery.data;
  const alerts = alertsQuery.data ?? [];
  const priorityAlerts = alerts.slice(0, isWide ? 4 : 3);
  const firstName = (session?.username || 'cobrador').split(' ')[0];
  const collectionProgress =
    (stats?.expectedCollection ?? 0) > 0
      ? Math.round(((stats?.monthlyCollection ?? 0) / (stats?.expectedCollection ?? 1)) * 100)
      : 0;

  const isRefreshing = statsQuery.isRefetching || alertsQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([statsQuery.refetch(), alertsQuery.refetch()]);
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

  const kpiCards: KpiItem[] = [
    {
      key: 'lent',
      label: 'Total prestado',
      value: formatCompactCurrency(stats?.totalLent ?? 0),
      hint: `${formatCompactCurrency(stats?.totalOutstanding ?? 0)} por cobrar`,
      icon: 'wallet-outline',
      iconColor: '#1D4ED8',
      iconBackground: '#DBEAFE',
    },
    {
      key: 'collection',
      label: 'Cobranza del mes',
      value: formatCompactCurrency(stats?.monthlyCollection ?? 0),
      hint:
        (stats?.expectedCollection ?? 0) > 0
          ? `${collectionProgress}% de la meta`
          : (stats?.monthlyCollection ?? 0) > 0
            ? 'Sin cuotas programadas'
            : 'Sin cuotas este mes',
      tone: 'success',
      icon: 'trending-up',
      iconColor: '#047857',
      iconBackground: '#D1FAE5',
    },
    {
      key: 'overdue',
      label: 'Vencido',
      value: formatCompactCurrency(stats?.overdueAmount ?? 0),
      hint: `${stats?.overduePayments ?? 0} cuota${(stats?.overduePayments ?? 0) === 1 ? '' : 's'}`,
      tone: 'danger',
      icon: 'alert-circle-outline',
      iconColor: '#B91C1C',
      iconBackground: '#FEE2E2',
    },
    {
      key: 'clients',
      label: 'Clientes',
      value: stats?.totalClients ?? 0,
      hint: `${stats?.activeLoans ?? 0} prestamo${(stats?.activeLoans ?? 0) === 1 ? '' : 's'} activo${(stats?.activeLoans ?? 0) === 1 ? '' : 's'}`,
      icon: 'people-outline',
      iconColor: '#7C3AED',
      iconBackground: '#EDE9FE',
    },
  ];

  const kpis = (
    <View style={appStyles.kpiGrid}>
      {kpiCards.map((card) => (
        <KpiCard
          key={card.key}
          label={card.label}
          value={card.value}
          hint={card.hint}
          tone={card.tone}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBackground={card.iconBackground}
          style={isWide ? appStyles.kpiCardWide : appStyles.kpiCardHalf}
        />
      ))}
    </View>
  );

  const alertCard =
    (stats?.overduePayments ?? 0) > 0 ? (
      <Pressable style={appStyles.alertCard} onPress={() => go('/collections')}>
        <View style={appStyles.inlineRowTop}>
          <Ionicons name="alert-circle" size={22} color="#B91C1C" />
          <View style={appStyles.flexOne}>
            <Text style={appStyles.alertTitle}>
              {stats?.overduePayments} cuota
              {(stats?.overduePayments ?? 0) === 1 ? '' : 's'} vencida
              {(stats?.overduePayments ?? 0) === 1 ? '' : 's'}
            </Text>
            <Text style={appStyles.alertText}>
              {formatCurrency(stats?.overdueAmount ?? 0)} por recuperar. Toca para ir a cobranza.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B91C1C" />
        </View>
      </Pressable>
    ) : (
      <View style={appStyles.card}>
        <View style={appStyles.inlineRowTop}>
          <Ionicons name="checkmark-circle" size={22} color="#047857" />
          <View style={appStyles.flexOne}>
            <Text style={appStyles.cardTitle}>Cartera al dia</Text>
            <Text style={appStyles.cardSubtitle}>
              No hay cuotas vencidas. Sigue registrando pagos para mantener el ritmo.
            </Text>
          </View>
        </View>
      </View>
    );

  const quickActions = (
    <View style={appStyles.quickRow}>
      <QuickAction
        icon="add-circle"
        label="Prestamo"
        primary
        onPress={() => go('/new-loan')}
      />
      <QuickAction icon="person-add" label="Cliente" onPress={() => go('/new-client')} />
      <QuickAction icon="cash" label="Cobrar" onPress={() => go('/collections')} />
      <QuickAction icon="calculator" label="Calculadora" onPress={() => go('/calculator')} />
    </View>
  );

  const priority = (
    <View style={{ gap: 10 }}>
      <SectionHeader
        title="Cobros prioritarios"
        subtitle={
          priorityAlerts.length > 0
            ? 'Vencidos y proximos a vencer.'
            : 'Sin cobros pendientes por ahora.'
        }
        actionLabel="Ver todo"
        onAction={() => go('/collections')}
      />

      {priorityAlerts.length === 0 ? (
        <EmptyState
          icon="cash-outline"
          title="Nada pendiente"
          message="Cuando una cuota este por vencer aparecera aqui."
        />
      ) : (
        priorityAlerts.map((alert) => {
          const isOverdue = alert.type === 'overdue';

          return (
            <Pressable
              key={alert.paymentId}
              style={[
                appStyles.compactRow,
                isOverdue ? appStyles.compactRowDanger : appStyles.compactRowWarning,
              ]}
              onPress={() => openPayment(alert.loanId, alert.paymentId)}
            >
              <View style={appStyles.dataRow}>
                <View style={appStyles.flexOne}>
                  <Text style={appStyles.rowStrong} numberOfLines={1}>
                    {alert.clientName}
                  </Text>
                  <Text
                    style={[
                      appStyles.rowMeta,
                      { color: isOverdue ? '#B91C1C' : '#B45309', fontWeight: '700' },
                    ]}
                  >
                    {isOverdue
                      ? `Vencio hace ${alert.daysOverdue} dia${alert.daysOverdue === 1 ? '' : 's'}`
                      : alert.daysUntil === 0
                        ? 'Vence hoy'
                        : `Vence en ${alert.daysUntil} dia${alert.daysUntil === 1 ? '' : 's'}`}
                  </Text>
                  <Text style={appStyles.rowMeta}>{formatDate(alert.dueDate)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8, maxWidth: '45%' }}>
                  <Text
                    style={[
                      appStyles.amountStrong,
                      isOverdue ? appStyles.amountDanger : appStyles.amountWarning,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {formatCurrency(alert.amount)}
                  </Text>
                  <View style={appStyles.iconRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Enviar WhatsApp a ${alert.clientName}`}
                      style={[
                        appStyles.iconButton,
                        appStyles.iconButtonSm,
                        appStyles.iconButtonSuccess,
                      ]}
                      onPress={() => handleAlertWhatsApp(alert)}
                    >
                      <Ionicons name="logo-whatsapp" size={17} color="#047857" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Agendar recordatorio para ${alert.clientName}`}
                      style={[appStyles.iconButton, appStyles.iconButtonSm]}
                      onPress={() => handleAlertReminder(alert)}
                    >
                      <Ionicons name="calendar-outline" size={17} color={APP_THEME.accent} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const shortcuts = (
    <View style={appStyles.shortcutRow}>
      <Pressable
        accessibilityRole="button"
        style={appStyles.shortcutButton}
        onPress={() => go('/portfolio')}
      >
        <Ionicons name="albums-outline" size={18} color={APP_THEME.accent} />
        <Text style={appStyles.shortcutText}>Ver cartera</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={appStyles.shortcutButton}
        onPress={() => go('/insights')}
      >
        <Ionicons name="stats-chart-outline" size={18} color={APP_THEME.accent} />
        <Text style={appStyles.shortcutText}>Ver analisis</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={appStyles.tabScreen} edges={['top']}>
      <ScrollView
        contentContainerStyle={appStyles.tabScroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        <TabHeader
          eyebrow={todayLabel}
          title={`Hola, ${firstName}`}
          subtitle="Tu cartera en el bolsillo."
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir ajustes"
              style={appStyles.iconButton}
              onPress={() => go('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={APP_THEME.accent} />
            </Pressable>
          }
        />

        {isWide ? (
          <View style={appStyles.dashStack}>
            {kpis}
            <View style={appStyles.dashGrid}>
              <View style={appStyles.dashColumn}>
                {alertCard}
                <SectionHeader title="Acciones rapidas" subtitle="Todo a un toque." />
                {quickActions}
              </View>
              <View style={appStyles.dashColumn}>
                {priority}
                {shortcuts}
              </View>
            </View>
          </View>
        ) : (
          <View style={appStyles.segmentBody}>
            {kpis}
            {alertCard}
            {priority}
            <SectionHeader title="Acciones rapidas" subtitle="Todo a un toque." />
            {quickActions}
            {shortcuts}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
