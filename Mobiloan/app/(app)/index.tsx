import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { openPhoneCall, openWhatsApp } from '../../src/lib/contact';
import { formatCurrency, formatDate, formatDateTime, getRelativeDueLabel } from '../../src/lib/format';
import {
  useClients,
  useCollectionQueue,
  usePendingOutbox,
  useRejectedOutbox,
  useSyncSnapshot,
} from '../../src/hooks/useOfflineData';
import {
  useDiscardRejectedMutation,
  useManualSync,
  useRetryRejectedMutation,
} from '../../src/hooks/useSyncActions';
import { useSession } from '../../src/providers/AppProviders';
import { syncService } from '../../src/services/sync';
import type { CollectionFilter } from '../../src/types/sync';
import { appStyles } from '../../src/ui/styles';

export default function PortfolioScreen() {
  const [search, setSearch] = useState('');
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('overdue');
  const { session, setSession, isOnline, hasOfflineData, lastSyncAt, needsReauth, authMessage, refreshAppState } = useSession();
  const queryClient = useQueryClient();
  const snapshotQuery = useSyncSnapshot();
  const clientsQuery = useClients(search);
  const collectionQueueQuery = useCollectionQueue(collectionFilter);
  const pendingOutboxQuery = usePendingOutbox();
  const rejectedOutboxQuery = useRejectedOutbox();
  const syncMutation = useManualSync();
  const retryRejectedMutation = useRetryRejectedMutation();
  const discardRejectedMutation = useDiscardRejectedMutation();

  const snapshot = snapshotQuery.data;
  const clients = clientsQuery.data ?? [];
  const collectionQueue = collectionQueueQuery.data ?? [];
  const pendingOutbox = pendingOutboxQuery.data ?? [];
  const rejectedOutbox = rejectedOutboxQuery.data ?? [];

  const handleSync = async () => {
    if (isOnline === false) {
      Alert.alert(
        'Modo offline activo',
        'La cartera local sigue disponible, pero esta sincronizacion necesita conexion al backend.',
      );
      return;
    }

    try {
      const results = await syncMutation.mutateAsync();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sync-snapshot'] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['collection-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['pending-outbox'] }),
        queryClient.invalidateQueries({ queryKey: ['rejected-outbox'] }),
        refreshAppState(),
      ]);

      const rejected = results.filter((item) => item.status === 'rejected').length;
      if (rejected > 0) {
        Alert.alert('Sync completada con observaciones', `${rejected} mutacion(es) requieren revision.`);
      }
    } catch (error) {
      Alert.alert('No se pudo sincronizar', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <ScrollView
      style={appStyles.screen}
      contentContainerStyle={appStyles.scroll}
      refreshControl={<RefreshControl refreshing={syncMutation.isPending} onRefresh={handleSync} />}
    >
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Cobranza en terreno</Text>
        <Text style={appStyles.heroSubtitle}>
          La cartera vive localmente en el telefono y se sincroniza cuando vuelve la conectividad.
        </Text>
      </View>

      <View style={[appStyles.card, appStyles.statusCard, isOnline === false ? appStyles.statusWarning : appStyles.statusInfo]}>
        <Text style={appStyles.statusTitle}>
          {needsReauth ? 'Reautenticacion pendiente' : isOnline === false ? 'Modo offline activo' : 'Operacion sincronizada'}
        </Text>
        <Text style={appStyles.statusText}>
          {needsReauth
            ? 'La cartera local sigue utilizable, pero el backend rechazo la sesion. Para volver a sincronizar, cierra sesion y entra otra vez con internet.'
            : isOnline === false
            ? hasOfflineData
              ? 'Puedes seguir cobrando con la cartera local. Los pagos nuevos quedaran en outbox hasta recuperar red.'
              : 'La app esta sin internet y aun no hay suficiente cartera local para trabajar con seguridad.'
            : 'La app puede empujar outbox, bajar cambios y refrescar la cartera desde el backend.'}
        </Text>
        {authMessage ? (
          <Text style={appStyles.statusText}>Detalle backend: {authMessage}</Text>
        ) : null}
        <Text style={appStyles.statusText}>
          Ultima sincronizacion: {formatDateTime(lastSyncAt)}
        </Text>
      </View>

      <View style={appStyles.statGrid}>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Clientes locales</Text>
          <Text style={appStyles.statValue}>{snapshot?.totalClients ?? 0}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Prestamos locales</Text>
          <Text style={appStyles.statValue}>{snapshot?.totalLoans ?? 0}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Pagos pendientes</Text>
          <Text style={appStyles.statValue}>{snapshot?.pendingOutbox ?? 0}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Pagos rechazados</Text>
          <Text style={appStyles.statValue}>{snapshot?.rejectedOutbox ?? 0}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Estado red</Text>
          <Text style={appStyles.statValue}>{isOnline === null ? '...' : isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Sincronizacion</Text>
            <Text style={appStyles.cardSubtitle}>
              Ultimo cursor: {snapshot?.lastCursor ? snapshot.lastCursor.slice(0, 19).replace('T', ' ') : 'sin sync'}
            </Text>
          </View>
          <Pressable style={appStyles.buttonMuted} onPress={handleSync}>
            <Text style={appStyles.buttonMutedText}>
              {syncMutation.isPending ? 'Sync...' : isOnline === false ? 'Esperando red' : 'Sincronizar'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Cobranza operativa</Text>
        <Text style={appStyles.cardSubtitle}>
          Filtros offline sobre la cartera local para trabajar aun sin conectividad.
        </Text>

        <View style={[appStyles.rowBetween, { flexWrap: 'wrap' }]}>
          {([
            ['overdue', 'Vencidas'],
            ['today', 'Hoy'],
            ['upcoming', 'Proximas'],
          ] as Array<[CollectionFilter, string]>).map(([value, label]) => (
            <Pressable
              key={value}
              style={value === collectionFilter ? appStyles.button : appStyles.buttonMuted}
              onPress={() => setCollectionFilter(value)}
            >
              <Text style={value === collectionFilter ? appStyles.buttonText : appStyles.buttonMutedText}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {collectionQueue.map((item) => (
          <View key={item.paymentId} style={appStyles.listItem}>
            <View
              style={[
                appStyles.pill,
                {
                  backgroundColor:
                    item.status === 'Overdue'
                      ? '#DC2626'
                      : item.status === 'Partial'
                        ? '#B45309'
                        : '#0E7490',
                },
              ]}
            >
              <Text style={appStyles.pillText}>{getRelativeDueLabel(item.dueDate)}</Text>
            </View>
            <Text style={appStyles.itemTitle}>{item.clientName}</Text>
            <Text style={appStyles.itemText}>
              Vence: {formatDate(item.dueDate)} - Estado: {item.status}
            </Text>
            <Text style={appStyles.itemText}>
              Pendiente: {formatCurrency(Math.max(item.amount + item.lateFee - item.paidAmount, 0))}
            </Text>
            <View style={appStyles.actionRow}>
              <Pressable
                style={appStyles.buttonMuted}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/loans/[id]',
                    params: { id: item.loanId, paymentId: item.paymentId },
                  })
                }
              >
                <Text style={appStyles.buttonMutedText}>Abrir cuota</Text>
              </Pressable>
              <Pressable
                style={appStyles.buttonMuted}
                onPress={async () => {
                  try {
                    await openPhoneCall(item.clientPhone);
                  } catch (error) {
                    Alert.alert('No se pudo llamar', error instanceof Error ? error.message : 'Error desconocido');
                  }
                }}
              >
                <Text style={appStyles.buttonMutedText}>Llamar</Text>
              </Pressable>
              <Pressable
                style={appStyles.buttonMuted}
                onPress={async () => {
                  try {
                    await openWhatsApp(item.clientPhone);
                  } catch (error) {
                    Alert.alert('No se pudo abrir WhatsApp', error instanceof Error ? error.message : 'Error desconocido');
                  }
                }}
              >
                <Text style={appStyles.buttonMutedText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {collectionQueue.length === 0 && (
          <Text style={appStyles.itemText}>
            No hay cuotas para este filtro en la base local.
          </Text>
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Buscar cartera</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={appStyles.input}
          placeholder="Nombre, RUT o telefono"
        />
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Clientes</Text>
            <Text style={appStyles.cardSubtitle}>
              Todo lo visible aqui sale de SQLite local, no de una llamada en vivo.
            </Text>
          </View>
          <Pressable
            style={appStyles.buttonDanger}
            onPress={async () => {
              await setSession(null);
              router.replace('/login');
            }}
          >
            <Text style={appStyles.buttonDangerText}>Salir</Text>
          </Pressable>
        </View>

        {clients.map((client) => (
          <Pressable
            key={client.id}
            style={appStyles.listItem}
            onPress={() => router.push({ pathname: '/(app)/clients/[id]', params: { id: client.id } })}
          >
            <Text style={appStyles.itemTitle}>{client.name}</Text>
            <Text style={appStyles.itemText}>{client.rut || 'Sin RUT'} - {client.phone || 'Sin telefono'}</Text>
            <Text style={appStyles.itemText}>
              Prestamos activos: {client.activeLoanCount}
            </Text>
          </Pressable>
        ))}

        {clients.length === 0 && (
          <Text style={appStyles.itemText}>
            No hay clientes locales todavia. Haz login con conexion y ejecuta la primera sincronizacion.
          </Text>
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Outbox pendiente</Text>
        <Text style={appStyles.cardSubtitle}>
          Pagos guardados localmente que aun no han sido confirmados por el backend.
        </Text>

        {pendingOutbox.map((mutation) => (
          <View key={mutation.id} style={appStyles.listItemMuted}>
            <View style={[appStyles.pill, { backgroundColor: '#0E7490' }]}>
              <Text style={appStyles.pillText}>Pendiente de envio</Text>
            </View>
            <Text style={appStyles.itemTitle}>
              {formatCurrency(mutation.payload.amount)} - {mutation.payload.method || 'Cash'}
            </Text>
            <Text style={appStyles.itemText}>
              {mutation.clientName || 'Cliente sin contexto local'} - Cuota: {mutation.payload.paymentId}
            </Text>
            <Text style={appStyles.itemText}>
              Guardado local: {formatDateTime(mutation.createdAt)}
            </Text>
            {mutation.dueDate && (
              <Text style={appStyles.itemText}>
                Vencimiento local: {formatDate(mutation.dueDate)}
                {mutation.remainingAmount !== null
                  ? ` - Saldo actual: ${formatCurrency(mutation.remainingAmount)}`
                  : ''}
              </Text>
            )}

            {mutation.loanId ? (
              <View style={[appStyles.rowBetween, { marginTop: 8, flexWrap: 'wrap' }]}>
                <Pressable
                  style={appStyles.buttonMuted}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/loans/[id]',
                      params: { id: mutation.loanId, paymentId: mutation.payload.paymentId },
                    })
                  }
                >
                  <Text style={appStyles.buttonMutedText}>Abrir cuota</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}

        {pendingOutbox.length === 0 && (
          <Text style={appStyles.itemText}>
            No hay pagos pendientes en outbox. Todo lo guardado localmente ya fue enviado o no existe aun.
          </Text>
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Reconciliacion de outbox</Text>
        <Text style={appStyles.cardSubtitle}>
          Si el servidor rechaza una mutacion, queda visible aqui para reintento o descarte manual.
        </Text>

        {rejectedOutbox.map((mutation) => (
          <View key={mutation.id} style={appStyles.listItemMuted}>
            <View style={[appStyles.pill, { backgroundColor: '#B91C1C' }]}>
              <Text style={appStyles.pillText}>Requiere revision</Text>
            </View>
            <Text style={appStyles.itemTitle}>
              {formatCurrency(mutation.payload.amount)} - {mutation.payload.method || 'Cash'}
            </Text>
            <Text style={appStyles.itemText}>
              {mutation.clientName || 'Cliente sin contexto local'} - Cuota: {mutation.payload.paymentId}
            </Text>
            <Text style={appStyles.itemText}>
              Fecha local: {formatDate(mutation.payload.paymentDate)}
            </Text>
            {mutation.dueDate && (
              <Text style={appStyles.itemText}>
                Vencimiento local: {formatDate(mutation.dueDate)}
                {mutation.remainingAmount !== null
                  ? ` - Saldo actual: ${formatCurrency(mutation.remainingAmount)}`
                  : ''}
              </Text>
            )}
            <Text style={[appStyles.itemText, { color: '#B91C1C' }]}>
              {mutation.errorCode || 'REJECTED'} - {mutation.errorMessage || 'Sin detalle'}
            </Text>

            <View style={[appStyles.rowBetween, { marginTop: 8, flexWrap: 'wrap' }]}>
              {mutation.loanId ? (
                <Pressable
                  style={appStyles.buttonMuted}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/loans/[id]',
                      params: { id: mutation.loanId, paymentId: mutation.payload.paymentId },
                    })
                  }
                >
                  <Text style={appStyles.buttonMutedText}>Abrir cuota</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={appStyles.buttonMuted}
                onPress={async () => {
                  try {
                    await retryRejectedMutation.mutateAsync(mutation.id);
                    if (session && (await syncService.isOnline())) {
                      await handleSync();
                    }
                  } catch (error) {
                    Alert.alert('No se pudo reintentar', error instanceof Error ? error.message : 'Error desconocido');
                  }
                }}
              >
                <Text style={appStyles.buttonMutedText}>Reintentar</Text>
              </Pressable>
              <Pressable
                style={appStyles.buttonDanger}
                onPress={async () => {
                  try {
                    await discardRejectedMutation.mutateAsync(mutation.id);
                  } catch (error) {
                    Alert.alert('No se pudo descartar', error instanceof Error ? error.message : 'Error desconocido');
                  }
                }}
              >
                <Text style={appStyles.buttonDangerText}>Descartar</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {rejectedOutbox.length === 0 && (
          <Text style={appStyles.itemText}>
            No hay mutaciones rechazadas. La outbox esta limpia por ahora.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
