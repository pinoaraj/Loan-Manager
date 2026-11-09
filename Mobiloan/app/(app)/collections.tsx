import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { createCollectionReminder } from '../../src/lib/calendar';
import { openPhoneCall, openWhatsApp } from '../../src/lib/contact';
import { formatCurrency, formatDate, getRelativeDueLabel } from '../../src/lib/format';
import { useCollectionQueue } from '../../src/hooks/useOfflineData';
import { appStyles } from '../../src/ui/styles';
import type { CollectionFilter, CollectionQueueItem } from '../../src/types/sync';

const FILTERS: Array<[CollectionFilter, string]> = [
  ['overdue', 'Vencidas'],
  ['today', 'Hoy'],
  ['upcoming', 'Proximas'],
];

const getRemaining = (item: CollectionQueueItem) =>
  Math.max(item.amount + item.lateFee - item.paidAmount, 0);

export default function CollectionsScreen() {
  const [filter, setFilter] = useState<CollectionFilter>('overdue');
  const [search, setSearch] = useState('');
  const queueQuery = useCollectionQueue(filter);
  const queue = queueQuery.data ?? [];
  const term = search.trim().toLowerCase();
  const items = term
    ? queue.filter(
        (item) =>
          item.clientName.toLowerCase().includes(term) ||
          (item.clientPhone ?? '').toLowerCase().includes(term),
      )
    : queue;

  const totalAmount = items.reduce((sum, item) => sum + getRemaining(item), 0);

  const handleCall = async (item: CollectionQueueItem) => {
    try {
      await openPhoneCall(item.clientPhone);
    } catch (error) {
      Alert.alert('No se pudo llamar', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleWhatsApp = async (item: CollectionQueueItem) => {
    try {
      await openWhatsApp(item.clientPhone);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir WhatsApp',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  };

  const handleReminder = async (item: CollectionQueueItem) => {
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
  };

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Cobranza</Text>
        <Text style={appStyles.heroSubtitle}>
          {items.length} cuota{items.length === 1 ? '' : 's'} en esta bandeja -{' '}
          {formatCurrency(totalAmount)} por cobrar
        </Text>
      </View>

      <View style={appStyles.card}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={appStyles.input}
          placeholder="Buscar cliente o telefono"
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
        {items.map((item) => {
          const remaining = getRemaining(item);

          return (
            <View key={item.paymentId} style={appStyles.listItem}>
              <View style={appStyles.rowBetween}>
                <Text style={appStyles.itemTitle}>{item.clientName}</Text>
                <Text style={appStyles.statValueSmall}>{formatCurrency(remaining)}</Text>
              </View>
              <Text style={appStyles.itemText}>
                {formatDate(item.dueDate)} - {getRelativeDueLabel(item.dueDate)}
              </Text>
              <Text style={appStyles.itemText}>
                Cuota: {formatCurrency(item.amount + item.lateFee)}
                {item.paidAmount > 0 ? ` - Abonado: ${formatCurrency(item.paidAmount)}` : ''}
              </Text>
              <Text style={appStyles.itemText}>
                Telefono: {item.clientPhone || 'Sin telefono'}
              </Text>

              <View style={appStyles.actionRow}>
                <Pressable style={appStyles.buttonMuted} onPress={() => handleCall(item)}>
                  <Text style={appStyles.buttonMutedText}>Llamar</Text>
                </Pressable>
                <Pressable style={appStyles.buttonMuted} onPress={() => handleWhatsApp(item)}>
                  <Text style={appStyles.buttonMutedText}>WhatsApp</Text>
                </Pressable>
                <Pressable style={appStyles.buttonMuted} onPress={() => handleReminder(item)}>
                  <Text style={appStyles.buttonMutedText}>Calendario</Text>
                </Pressable>
                <Pressable
                  style={appStyles.button}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/loans/[id]',
                      params: { id: item.loanId, paymentId: item.paymentId },
                    })
                  }
                >
                  <Text style={appStyles.buttonText}>Abrir cuota</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {items.length === 0 ? (
          <Text style={appStyles.emptyState}>
            {term
              ? 'No encontramos cuotas para esa busqueda en esta bandeja.'
              : filter === 'overdue'
                ? 'No hay cuotas vencidas. La cartera esta al dia.'
                : filter === 'today'
                  ? 'No hay cuotas que venzan hoy.'
                  : 'No hay cuotas proximas en este momento.'}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
