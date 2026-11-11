import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCollectionQueue, usePaymentAlerts } from '../../../src/hooks/useOfflineData';
import { createCollectionReminder } from '../../../src/lib/calendar';
import { APP_THEME } from '../../../src/lib/config';
import { openPhoneCall, openWhatsApp } from '../../../src/lib/contact';
import { differenceInDays, parseStoredDate } from '../../../src/lib/dates';
import { formatCurrency, formatDate, getRelativeDueLabel } from '../../../src/lib/format';
import { getReminderMessage } from '../../../src/lib/messages';
import type { CollectionFilter, CollectionQueueItem } from '../../../src/types/sync';
import { EmptyState, SectionHeader, TabHeader } from '../../../src/ui/components';
import { appStyles } from '../../../src/ui/styles';

const FILTERS: Array<[CollectionFilter, string]> = [
  ['overdue', 'Vencidas'],
  ['today', 'Hoy'],
  ['upcoming', 'Proximas'],
];

const getRemaining = (item: CollectionQueueItem) =>
  Math.max(item.amount + item.lateFee - item.paidAmount, 0);

interface RowProps {
  item: CollectionQueueItem;
  onCall: (item: CollectionQueueItem) => void;
  onWhatsApp: (item: CollectionQueueItem) => void;
  onReminder: (item: CollectionQueueItem) => void;
  onOpen: (item: CollectionQueueItem) => void;
}

const CollectionRow = memo(function CollectionRow({
  item,
  onCall,
  onWhatsApp,
  onReminder,
  onOpen,
}: RowProps) {
  const remaining = getRemaining(item);
  const dueDate = parseStoredDate(item.dueDate);
  const isOverdue = dueDate ? differenceInDays(new Date(), dueDate) > 0 : false;

  return (
    <View style={[appStyles.compactRow, isOverdue && appStyles.compactRowDanger]}>
      <View style={appStyles.dataRow}>
        <Text style={appStyles.rowStrong}>{item.clientName}</Text>
        <Text style={[appStyles.amountStrong, isOverdue && appStyles.amountDanger]}>
          {formatCurrency(remaining)}
        </Text>
      </View>
      <Text style={[appStyles.rowMeta, isOverdue && { color: '#B91C1C', fontWeight: '700' }]}>
        {formatDate(item.dueDate)} · {getRelativeDueLabel(item.dueDate)}
      </Text>
      <Text style={appStyles.rowMeta}>
        Cuota {formatCurrency(item.amount + item.lateFee)}
        {item.paidAmount > 0 ? ` · abonado ${formatCurrency(item.paidAmount)}` : ''}
      </Text>
      <Text style={appStyles.rowMeta}>Telefono: {item.clientPhone || 'sin telefono'}</Text>

      <View style={appStyles.iconRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Llamar a ${item.clientName}`}
          style={appStyles.iconButton}
          onPress={() => onCall(item)}
        >
          <Ionicons name="call-outline" size={19} color={APP_THEME.accent} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Enviar WhatsApp a ${item.clientName}`}
          style={[appStyles.iconButton, appStyles.iconButtonSuccess]}
          onPress={() => onWhatsApp(item)}
        >
          <Ionicons name="logo-whatsapp" size={19} color="#047857" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Agendar recordatorio para ${item.clientName}`}
          style={appStyles.iconButton}
          onPress={() => onReminder(item)}
        >
          <Ionicons name="calendar-outline" size={19} color={APP_THEME.accent} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[appStyles.buttonMuted, { flex: 1 }]}
          onPress={() => onOpen(item)}
        >
          <Text style={appStyles.buttonMutedText}>Abrir cuota</Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function CollectionsScreen() {
  const [filter, setFilter] = useState<CollectionFilter>('overdue');
  const [search, setSearch] = useState('');
  const queueQuery = useCollectionQueue(filter);
  const alertsQuery = usePaymentAlerts(500);
  const queue = queueQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const overdueAlerts = alerts.filter((alert) => alert.type === 'overdue');
  const upcomingAlerts = alerts.filter((alert) => alert.type === 'upcoming');
  const overdueTotal = overdueAlerts.reduce((sum, alert) => sum + alert.amount, 0);
  const upcomingTotal = upcomingAlerts.reduce((sum, alert) => sum + alert.amount, 0);
  const term = search.trim().toLowerCase();
  const items = term
    ? queue.filter(
        (item) =>
          item.clientName.toLowerCase().includes(term) ||
          (item.clientPhone ?? '').toLowerCase().includes(term),
      )
    : queue;
  const totalAmount = items.reduce((sum, item) => sum + getRemaining(item), 0);

  const handleCall = useCallback(async (item: CollectionQueueItem) => {
    try {
      await openPhoneCall(item.clientPhone);
    } catch (error) {
      Alert.alert('No se pudo llamar', error instanceof Error ? error.message : 'Error desconocido');
    }
  }, []);

  const handleWhatsApp = useCallback(async (item: CollectionQueueItem) => {
    try {
      const dueDate = parseStoredDate(item.dueDate);
      const type = dueDate && differenceInDays(new Date(), dueDate) > 0 ? 'overdue' : 'upcoming';
      const message = getReminderMessage(
        item.clientName,
        getRemaining(item),
        item.dueDate,
        type,
      );
      await openWhatsApp(item.clientPhone, message);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir WhatsApp',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }, []);

  const handleReminder = useCallback(async (item: CollectionQueueItem) => {
    try {
      await createCollectionReminder({
        clientName: item.clientName,
        clientPhone: item.clientPhone,
        paymentId: item.paymentId,
        loanId: item.loanId,
        amount: getRemaining(item),
        dueDate: item.dueDate,
        installmentLabel: `cuota ${formatDate(item.dueDate)}`,
      });
      Alert.alert('Recordatorio creado', 'La cobranza quedo guardada en el calendario del telefono.');
    } catch (error) {
      Alert.alert(
        'No se pudo crear el recordatorio',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  }, []);

  const handleOpen = useCallback((item: CollectionQueueItem) => {
    router.push({
      pathname: '/(app)/loans/[id]',
      params: { id: item.loanId, paymentId: item.paymentId },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: CollectionQueueItem }) => (
      <CollectionRow
        item={item}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onReminder={handleReminder}
        onOpen={handleOpen}
      />
    ),
    [handleCall, handleOpen, handleReminder, handleWhatsApp],
  );

  const isRefreshing = queueQuery.isRefetching || alertsQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([queueQuery.refetch(), alertsQuery.refetch()]);
  };

  return (
    <SafeAreaView style={appStyles.tabScreen} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.paymentId}
        renderItem={renderItem}
        contentContainerStyle={appStyles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <TabHeader
              title="Cobranza"
              subtitle={`${items.length} cuota${items.length === 1 ? '' : 's'} · ${formatCurrency(
                totalAmount,
              )} por cobrar`}
            />

            <View style={appStyles.summaryRow}>
              <View style={[appStyles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[appStyles.summaryLabel, { color: '#B91C1C' }]}>Total vencido</Text>
                <Text style={[appStyles.summaryValue, appStyles.amountDanger]}>
                  {formatCurrency(overdueTotal)}
                </Text>
                <Text style={appStyles.rowMeta}>
                  {overdueAlerts.length} pago{overdueAlerts.length === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={[appStyles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[appStyles.summaryLabel, { color: '#1D4ED8' }]}>
                  Proximos 30 dias
                </Text>
                <Text style={[appStyles.summaryValue, { color: '#1D4ED8' }]}>
                  {formatCurrency(upcomingTotal)}
                </Text>
                <Text style={appStyles.rowMeta}>
                  {upcomingAlerts.length} pago{upcomingAlerts.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              style={appStyles.input}
              placeholder="Buscar cliente o telefono"
              placeholderTextColor="#94A3B8"
            />

            <View style={appStyles.filterRow}>
              {FILTERS.map(([value, label]) => {
                const count =
                  value === 'overdue'
                    ? overdueAlerts.length
                    : value === 'upcoming'
                      ? upcomingAlerts.length
                      : null;
                const active = value === filter;

                return (
                  <Pressable
                    key={value}
                    style={[appStyles.filterChip, active && appStyles.filterChipActive]}
                    onPress={() => setFilter(value)}
                  >
                    <Text
                      style={[
                        appStyles.filterChipText,
                        active && appStyles.filterChipTextActive,
                      ]}
                    >
                      {label}
                      {count !== null ? ` (${count})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <SectionHeader
              title="Bandeja"
              subtitle={
                filter === 'overdue'
                  ? 'Cuotas vencidas por recuperar.'
                  : filter === 'today'
                    ? 'Cuotas que vencen hoy.'
                    : 'Cuotas de los proximos dias.'
              }
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title={
              term
                ? 'Sin resultados'
                : filter === 'overdue'
                  ? 'Cartera al dia'
                  : filter === 'today'
                    ? 'Nada vence hoy'
                    : 'Sin cobros proximos'
            }
            message={
              term
                ? 'No encontramos cuotas para esa busqueda en esta bandeja.'
                : filter === 'overdue'
                  ? 'No hay cuotas vencidas pendientes.'
                  : filter === 'today'
                    ? 'No hay cuotas que venzan hoy.'
                    : 'No hay cuotas proximas en este momento.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}
