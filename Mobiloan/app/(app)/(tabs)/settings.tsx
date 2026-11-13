import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useLoans,
  usePendingOutbox,
  useRejectedOutbox,
  useSyncSnapshot,
} from '../../../src/hooks/useOfflineData';
import {
  useDiscardRejectedMutation,
  useImportPortableSnapshot,
  useManualSync,
  useRetryRejectedMutation,
} from '../../../src/hooks/useSyncActions';
import { APP_VERSION } from '../../../src/lib/config';
import { formatCurrency, formatDate, formatDateTime } from '../../../src/lib/format';
import { paymentMethodLabel } from '../../../src/lib/labels';
import { pickPortableSnapshot, sharePortfolioCsv } from '../../../src/lib/reports';
import { exportPortableSyncPackage } from '../../../src/lib/syncPackage';
import { useSession } from '../../../src/providers/AppProviders';
import { syncService } from '../../../src/services/sync';
import { SegmentedControl, TabHeader } from '../../../src/ui/components';
import { appStyles } from '../../../src/ui/styles';

type SettingsView = 'app' | 'datos' | 'sync';

const VIEWS: Array<{ value: SettingsView; label: string }> = [
  { value: 'app', label: 'App' },
  { value: 'datos', label: 'Datos' },
  { value: 'sync', label: 'Sync' },
];

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [view, setView] = useState<SettingsView>('app');
  const {
    session,
    setSession,
    isOnline,
    lastSyncAt,
    needsReauth,
    authMessage,
    refreshAppState,
  } = useSession();
  const snapshotQuery = useSyncSnapshot();
  const loansQuery = useLoans();
  const pendingOutboxQuery = usePendingOutbox();
  const rejectedOutboxQuery = useRejectedOutbox();
  const syncMutation = useManualSync();
  const retryRejectedMutation = useRetryRejectedMutation();
  const discardRejectedMutation = useDiscardRejectedMutation();
  const importMutation = useImportPortableSnapshot();
  const [exporting, setExporting] = useState(false);
  const [exportingPortfolio, setExportingPortfolio] = useState(false);
  const [importing, setImporting] = useState(false);

  const snapshot = snapshotQuery.data;
  const loans = loansQuery.data ?? [];
  const pendingOutbox = pendingOutboxQuery.data ?? [];
  const rejectedOutbox = rejectedOutboxQuery.data ?? [];
  const isLocal = session?.mode === 'local';

  const handleSync = async () => {
    if (isOnline === false) {
      Alert.alert(
        'Sin conexion',
        'La cartera local sigue disponible, pero esta sincronizacion necesita conexion al backend.',
      );
      return;
    }

    try {
      const results = await syncMutation.mutateAsync();
      await Promise.all([
        snapshotQuery.refetch(),
        pendingOutboxQuery.refetch(),
        rejectedOutboxQuery.refetch(),
      ]);
      await refreshAppState();

      const rejected = results.filter((item) => item.status === 'rejected').length;
      if (rejected > 0) {
        Alert.alert(
          'Sincronizacion con observaciones',
          `${rejected} movimiento(s) requieren revision.`,
        );
      } else {
        Alert.alert('Sincronizacion completada', 'La cartera quedo al dia con el escritorio.');
      }
    } catch (error) {
      Alert.alert(
        'No se pudo sincronizar',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPortableSyncPackage();
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPortfolio = async () => {
    if (loans.length === 0) {
      Alert.alert('Sin prestamos', 'Todavia no hay prestamos para exportar.');
      return;
    }

    setExportingPortfolio(true);
    try {
      await sharePortfolioCsv(loans);
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setExportingPortfolio(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const payload = await pickPortableSnapshot();
      if (!payload) {
        return;
      }

      const result = await importMutation.mutateAsync(payload);
      await refreshAppState();
      Alert.alert(
        'Respaldo importado',
        `${result.clients} clientes, ${result.loans} prestamos y ${result.payments} cuotas quedaron en el telefono.`,
      );
    } catch (error) {
      Alert.alert('No se pudo importar', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setImporting(false);
    }
  };

  const appView = (
    <View style={appStyles.segmentBody}>
      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Estado de la app</Text>
        <Text style={appStyles.itemText}>Version: beta {APP_VERSION}</Text>
        <Text style={appStyles.itemText}>
          Modo: {isLocal ? 'independiente (sin PC)' : 'sincronizado con el escritorio'}
        </Text>
        <Text style={appStyles.itemText}>Usuario: {session?.username || 'Sin sesion'}</Text>
        <Text style={appStyles.itemText}>
          Red: {isOnline === null ? 'verificando...' : isOnline ? 'conectado' : 'sin conexion'}
        </Text>
        {isLocal ? (
          <Text style={appStyles.itemText}>
            Todo lo que registras se guarda en este telefono. Puedes exportar un respaldo cuando
            quieras.
          </Text>
        ) : (
          <Text style={appStyles.itemText}>
            Ultima sincronizacion: {formatDateTime(lastSyncAt)}
            {needsReauth ? ' - La sesion remota vencio, vuelve a entrar con internet.' : ''}
          </Text>
        )}
        {authMessage ? (
          <Text style={appStyles.itemText}>Detalle backend: {authMessage}</Text>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Sesion</Text>
        <Text style={appStyles.cardSubtitle}>
          Cerrar sesion no borra tus datos locales.
        </Text>
        <Pressable
          style={appStyles.buttonDanger}
          onPress={async () => {
            await setSession(null);
            router.replace('/login');
          }}
        >
          <Text style={appStyles.buttonDangerText}>Salir de la app</Text>
        </Pressable>
      </View>
    </View>
  );

  const backupCard = (
      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Respaldo e importacion</Text>
        <Text style={appStyles.cardSubtitle}>
          Exporta toda la cartera a un archivo JSON o recupera un respaldo anterior.
        </Text>
        <View style={appStyles.actionRow}>
          <Pressable style={appStyles.buttonMuted} onPress={handleExport} disabled={exporting}>
            <Text style={appStyles.buttonMutedText}>
              {exporting ? 'Exportando...' : 'Exportar respaldo'}
            </Text>
          </Pressable>
          <Pressable style={appStyles.buttonMuted} onPress={handleImport} disabled={importing}>
            <Text style={appStyles.buttonMutedText}>
              {importing ? 'Importando...' : 'Importar respaldo'}
            </Text>
          </Pressable>
        </View>
      </View>
  );

  const reportsCard = (
      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Reportes</Text>
        <Text style={appStyles.cardSubtitle}>
          Exporta la cartera completa a un archivo CSV para abrirlo en Excel.
        </Text>
        <Pressable
          style={appStyles.buttonMuted}
          onPress={handleExportPortfolio}
          disabled={exportingPortfolio}
        >
          <Text style={appStyles.buttonMutedText}>
            {exportingPortfolio ? 'Exportando...' : 'Exportar cartera (CSV)'}
          </Text>
        </Pressable>
        <Text style={appStyles.itemText}>
          {loans.length} prestamo{loans.length === 1 ? '' : 's'} en el telefono.
        </Text>
      </View>
  );

  const dataView = (
    <View style={appStyles.segmentBody}>
      {isWide ? (
        <View style={appStyles.dashGrid}>
          <View style={appStyles.dashColumn}>{backupCard}</View>
          <View style={appStyles.dashColumn}>{reportsCard}</View>
        </View>
      ) : (
        <>
          {backupCard}
          {reportsCard}
        </>
      )}
    </View>
  );

  const syncView = isLocal ? (
    <View style={appStyles.segmentBody}>
      <View style={appStyles.infoCard}>
        <Text style={appStyles.infoTitle}>Modo independiente</Text>
        <Text style={appStyles.infoText}>
          La app funciona sin el PC. La sincronizacion solo se usa si decides conectar esta
          instalacion con el escritorio; mientras tanto, usa los respaldos de la pestana Datos.
        </Text>
      </View>
    </View>
  ) : (
    <View style={appStyles.segmentBody}>
      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.cardTitle}>Sincronizacion</Text>
            <Text style={appStyles.cardSubtitle}>
              Ultimo cursor:{' '}
              {snapshot?.lastCursor
                ? snapshot.lastCursor.slice(0, 19).replace('T', ' ')
                : 'sin sincronizacion'}
            </Text>
          </View>
          <Pressable style={[appStyles.button, { flexShrink: 0 }]} onPress={handleSync}>
            <Text style={appStyles.buttonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {syncMutation.isPending
                ? 'Sincronizando...'
                : isOnline === false
                  ? 'Sin red'
                  : 'Sincronizar'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Pagos pendientes de envio</Text>
        <Text style={appStyles.cardSubtitle}>
          Pagos guardados en el telefono que aun no confirma el escritorio.
        </Text>

        {pendingOutbox.map((mutation) => (
          <View key={mutation.id} style={appStyles.listItemMuted}>
            <View style={[appStyles.pill, { backgroundColor: '#0E7490' }]}>
              <Text style={appStyles.pillText}>Pendiente</Text>
            </View>
            <Text style={appStyles.itemTitle}>
              {formatCurrency(mutation.payload.amount)} -{' '}
              {paymentMethodLabel(mutation.payload.method)}
            </Text>
            <Text style={appStyles.itemText}>
              {mutation.clientName || 'Cliente sin contexto local'} - Cuota:{' '}
              {mutation.payload.paymentId}
            </Text>
            <Text style={appStyles.itemText}>
              Guardado local: {formatDateTime(mutation.createdAt)}
            </Text>
            {mutation.dueDate ? (
              <Text style={appStyles.itemText}>
                Vence: {formatDate(mutation.dueDate)}
                {mutation.remainingAmount !== null
                  ? ` - Saldo: ${formatCurrency(mutation.remainingAmount)}`
                  : ''}
              </Text>
            ) : null}
            {mutation.loanId ? (
              <Pressable
                style={appStyles.buttonMuted}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/loans/[id]',
                    params: {
                      id: String(mutation.loanId),
                      paymentId: mutation.payload.paymentId ?? '',
                    },
                  })
                }
              >
                <Text style={appStyles.buttonMutedText}>Abrir cuota</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {pendingOutbox.length === 0 ? (
          <Text style={appStyles.emptyState}>
            No hay pagos pendientes. Todo lo guardado ya fue enviado.
          </Text>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Movimientos rechazados</Text>
        <Text style={appStyles.cardSubtitle}>
          Si el escritorio rechaza un pago, puedes reintentarlo o descartarlo aqui.
        </Text>

        {rejectedOutbox.map((mutation) => (
          <View key={mutation.id} style={appStyles.listItemMuted}>
            <View style={[appStyles.pill, { backgroundColor: '#B91C1C' }]}>
              <Text style={appStyles.pillText}>Requiere revision</Text>
            </View>
            <Text style={appStyles.itemTitle}>
              {formatCurrency(mutation.payload.amount)} -{' '}
              {paymentMethodLabel(mutation.payload.method)}
            </Text>
            <Text style={appStyles.itemText}>
              {mutation.clientName || 'Cliente sin contexto local'} - Cuota:{' '}
              {mutation.payload.paymentId}
            </Text>
            <Text style={[appStyles.itemText, { color: '#B91C1C' }]}>
              {mutation.errorCode || 'REJECTED'} - {mutation.errorMessage || 'Sin detalle'}
            </Text>

            <View style={appStyles.actionRow}>
              <Pressable
                style={appStyles.buttonMuted}
                onPress={async () => {
                  try {
                    await retryRejectedMutation.mutateAsync(mutation.id);
                    if (session && (await syncService.isOnline())) {
                      await handleSync();
                    }
                  } catch (error) {
                    Alert.alert(
                      'No se pudo reintentar',
                      error instanceof Error ? error.message : 'Error desconocido',
                    );
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
                    Alert.alert(
                      'No se pudo descartar',
                      error instanceof Error ? error.message : 'Error desconocido',
                    );
                  }
                }}
              >
                <Text style={appStyles.buttonDangerText}>Descartar</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {rejectedOutbox.length === 0 ? (
          <Text style={appStyles.emptyState}>No hay movimientos rechazados.</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={appStyles.tabScreen} edges={['top']}>
      <ScrollView contentContainerStyle={appStyles.tabScroll}>
        <TabHeader title="Ajustes" subtitle="Respaldo, reportes y estado de la app." />
        <SegmentedControl options={VIEWS} value={view} onChange={setView} />
        {view === 'app' ? appView : null}
        {view === 'datos' ? dataView : null}
        {view === 'sync' ? syncView : null}
      </ScrollView>
    </SafeAreaView>
  );
}
