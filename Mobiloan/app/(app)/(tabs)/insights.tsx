import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useCollectionProjections,
  useDashboardStats,
  useLoans,
  useRecentActivity,
} from '../../../src/hooks/useOfflineData';
import { APP_THEME } from '../../../src/lib/config';
import { formatCompactCurrency, formatCurrency, formatDate } from '../../../src/lib/format';
import { sharePortfolioCsv } from '../../../src/lib/reports';
import type { RecentActivityItem } from '../../../src/types/sync';
import {
  EmptyState,
  KpiCard,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  TabHeader,
} from '../../../src/ui/components';
import { appStyles } from '../../../src/ui/styles';

type InsightsView = 'resumen' | 'proyeccion' | 'actividad';

const VIEWS: Array<{ value: InsightsView; label: string }> = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'proyeccion', label: 'Proyeccion' },
  { value: 'actividad', label: 'Actividad' },
];

const ActivityRow = memo(function ActivityRow({ item }: { item: RecentActivityItem }) {
  return (
    <Pressable
      style={appStyles.compactRow}
      onPress={() => router.push({ pathname: '/(app)/loans/[id]', params: { id: item.loanId } })}
    >
      <View style={appStyles.dataRow}>
        <Text style={appStyles.rowStrong}>{item.clientName}</Text>
        <Text style={[appStyles.amountStrong, appStyles.amountSuccess]}>
          +{formatCurrency(item.amount)}
        </Text>
      </View>
      <Text style={appStyles.rowMeta}>
        {formatDate(item.date)} · {item.method}
      </Text>
      {item.note ? <Text style={appStyles.rowMeta}>{item.note}</Text> : null}
    </Pressable>
  );
});

export default function InsightsScreen() {
  const [view, setView] = useState<InsightsView>('resumen');
  const [exporting, setExporting] = useState(false);
  const statsQuery = useDashboardStats();
  const projectionsQuery = useCollectionProjections(6);
  const activityQuery = useRecentActivity(20);
  const loansQuery = useLoans();

  const stats = statsQuery.data;
  const projections = projectionsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const loans = loansQuery.data ?? [];

  const totalScheduled = stats?.totalScheduled ?? 0;
  const totalCollected = stats?.totalCollected ?? 0;
  const totalOutstanding = stats?.totalOutstanding ?? 0;
  const overdueAmount = stats?.overdueAmount ?? 0;
  const paidShare = totalScheduled > 0 ? (totalCollected / totalScheduled) * 100 : 0;
  const outstandingShare =
    totalScheduled > 0 ? (Math.max(totalOutstanding - overdueAmount, 0) / totalScheduled) * 100 : 0;
  const overdueShare = totalScheduled > 0 ? (overdueAmount / totalScheduled) * 100 : 0;

  const monthlyCollection = stats?.monthlyCollection ?? 0;
  const expectedCollection = stats?.expectedCollection ?? 0;
  const goalProgress =
    expectedCollection > 0 ? Math.min((monthlyCollection / expectedCollection) * 100, 100) : 0;
  const goalRemaining = Math.max(expectedCollection - monthlyCollection, 0);

  const maxProjection = Math.max(...projections.map((point) => point.amount), 1);

  const isRefreshing =
    statsQuery.isRefetching ||
    projectionsQuery.isRefetching ||
    activityQuery.isRefetching ||
    loansQuery.isRefetching;

  const refresh = async () => {
    await Promise.all([
      statsQuery.refetch(),
      projectionsQuery.refetch(),
      activityQuery.refetch(),
      loansQuery.refetch(),
    ]);
  };

  const handleExport = async () => {
    if (loans.length === 0) {
      Alert.alert('Sin datos', 'Todavia no hay prestamos para exportar.');
      return;
    }

    setExporting(true);
    try {
      await sharePortfolioCsv(loans);
    } catch (error) {
      Alert.alert(
        'No se pudo exportar',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    } finally {
      setExporting(false);
    }
  };

  const renderActivity = useCallback(
    ({ item }: { item: RecentActivityItem }) => <ActivityRow item={item} />,
    [],
  );

  const resumen = (
    <View style={appStyles.segmentBody}>
      <View style={appStyles.summaryRow}>
        <View style={appStyles.summaryCard}>
          <Text style={appStyles.summaryLabel}>Prestado</Text>
          <Text style={appStyles.summaryValue}>{formatCompactCurrency(stats?.totalLent ?? 0)}</Text>
        </View>
        <View style={appStyles.summaryCard}>
          <Text style={appStyles.summaryLabel}>Por cobrar</Text>
          <Text style={appStyles.summaryValue}>
            {formatCompactCurrency(stats?.totalOutstanding ?? 0)}
          </Text>
        </View>
        <View style={appStyles.summaryCard}>
          <Text style={appStyles.summaryLabel}>Cobrado</Text>
          <Text style={[appStyles.summaryValue, appStyles.amountSuccess]}>
            {formatCompactCurrency(stats?.totalCollected ?? 0)}
          </Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.cardTitle}>Estado de la cartera</Text>
          <Text style={appStyles.rowMeta}>{Math.round(paidShare)}% cobrado</Text>
        </View>

        <View style={appStyles.segmentBar}>
          <View
            style={[
              appStyles.segment,
              { width: `${paidShare}%`, backgroundColor: APP_THEME.success },
            ]}
          />
          <View
            style={[
              appStyles.segment,
              { width: `${outstandingShare}%`, backgroundColor: APP_THEME.accent },
            ]}
          />
          <View
            style={[
              appStyles.segment,
              { width: `${overdueShare}%`, backgroundColor: APP_THEME.danger },
            ]}
          />
        </View>

        <View style={appStyles.legendRow}>
          <View style={appStyles.legendItem}>
            <View style={[appStyles.legendDot, { backgroundColor: APP_THEME.success }]} />
            <Text style={appStyles.legendText}>
              Pagado {formatCompactCurrency(totalCollected)}
            </Text>
          </View>
          <View style={appStyles.legendItem}>
            <View style={[appStyles.legendDot, { backgroundColor: APP_THEME.accent }]} />
            <Text style={appStyles.legendText}>
              Por cobrar {formatCompactCurrency(Math.max(totalOutstanding - overdueAmount, 0))}
            </Text>
          </View>
          <View style={appStyles.legendItem}>
            <View style={[appStyles.legendDot, { backgroundColor: APP_THEME.danger }]} />
            <Text style={appStyles.legendText}>Vencido {formatCompactCurrency(overdueAmount)}</Text>
          </View>
        </View>

        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>Mora sobre cartera (PAR)</Text>
          <Text style={[appStyles.dataValue, appStyles.amountDanger]}>
            {formatCompactCurrency(stats?.parAmount ?? 0)}
          </Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.cardTitle}>Meta de cobranza del mes</Text>
          <Text style={appStyles.rowMeta}>{Math.round(goalProgress)}%</Text>
        </View>
        <ProgressBar
          value={goalProgress}
          color={goalProgress >= 100 ? APP_THEME.success : APP_THEME.accent}
        />
        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>
            {formatCurrency(monthlyCollection)} de {formatCurrency(expectedCollection)}
          </Text>
          <Text style={appStyles.dataValue}>
            {goalRemaining > 0 ? `Faltan ${formatCompactCurrency(goalRemaining)}` : 'Meta cumplida'}
          </Text>
        </View>
      </View>

      <View style={appStyles.kpiGrid}>
        <KpiCard
          label="Prestamos"
          value={stats?.totalLoans ?? 0}
          hint={`${stats?.paidLoans ?? 0} pagados`}
        />
        <KpiCard
          label="Vencidos"
          value={stats?.overdueLoans ?? 0}
          hint={`${formatCompactCurrency(overdueAmount)} en mora`}
          tone="danger"
        />
        <KpiCard
          label="Salud de cartera"
          value={`${Math.round(stats?.healthScore ?? 0)}%`}
          hint="Pagos al dia"
          tone={(stats?.healthScore ?? 0) >= 80 ? 'success' : 'default'}
        />
        <KpiCard
          label="En pausa"
          value={stats?.pausedLoans ?? 0}
          hint="Prestamos detenidos"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        style={[appStyles.buttonMuted, exporting && appStyles.pressed]}
        onPress={handleExport}
        disabled={exporting}
      >
        <View style={appStyles.inlineRow}>
          <Ionicons name="download-outline" size={18} color={APP_THEME.accent} />
          <Text style={appStyles.buttonMutedText}>
            {exporting ? 'Preparando archivo...' : 'Exportar cartera (CSV)'}
          </Text>
        </View>
      </Pressable>
    </View>
  );

  const proyeccion = (
    <View style={appStyles.segmentBody}>
      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Proyeccion a 6 meses</Text>
        <Text style={appStyles.cardSubtitle}>Cuotas pendientes agrupadas por mes.</Text>

        {projections.length === 0 ? (
          <Text style={appStyles.rowMeta}>No hay cuotas pendientes para proyectar.</Text>
        ) : (
          <>
            <View style={appStyles.chartRow}>
              {projections.map((point) => {
                const height = Math.max(6, Math.round((point.amount / maxProjection) * 90));

                return (
                  <View key={point.monthKey} style={appStyles.chartColumn}>
                    <Text style={appStyles.chartValue} numberOfLines={1}>
                      {formatCompactCurrency(point.amount)}
                    </Text>
                    <View style={appStyles.chartTrack}>
                      <View style={[appStyles.chartFill, { height }]} />
                    </View>
                    <Text style={appStyles.chartLabel} numberOfLines={1}>
                      {point.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={{ gap: 8 }}>
              {projections.map((point) => (
                <View key={`row-${point.monthKey}`} style={appStyles.dataRow}>
                  <Text style={appStyles.dataLabel}>{point.label}</Text>
                  <Text style={appStyles.dataValue}>{formatCurrency(point.amount)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={appStyles.infoCard}>
        <Text style={appStyles.infoTitle}>Como leer la proyeccion</Text>
        <Text style={appStyles.infoText}>
          Cada barra suma las cuotas impagas de ese mes. Si una barra cae, revisa la bandeja de
          cobranza para recuperar esos pagos.
        </Text>
      </View>
    </View>
  );

  const header = (
    <View style={appStyles.segmentBody}>
      <TabHeader title="Analisis" subtitle="Salud, meta y proyeccion de tu cartera." />
      <SegmentedControl options={VIEWS} value={view} onChange={setView} />
      {view === 'resumen' ? resumen : null}
      {view === 'proyeccion' ? proyeccion : null}
      {view === 'actividad' ? (
        <SectionHeader
          title="Actividad reciente"
          subtitle="Ultimos pagos registrados en el telefono."
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={appStyles.tabScreen} edges={['top']}>
      <FlatList
        data={view === 'actividad' ? activity : []}
        keyExtractor={(item) => item.id}
        renderItem={renderActivity}
        contentContainerStyle={appStyles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          view === 'actividad' ? (
            <EmptyState
              icon="bar-chart-outline"
              title="Sin actividad todavia"
              message="Cuando registres pagos veras aqui el historial."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
