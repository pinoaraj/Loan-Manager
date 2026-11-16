import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAllClients } from '../../src/hooks/useOfflineData';
import { useImportPortableSnapshot } from '../../src/hooks/useSyncActions';
import { APP_THEME } from '../../src/lib/config';
import { formatCurrency, formatDate, formatDateTime } from '../../src/lib/format';
import {
  buildPortablePreview,
  buildSpreadsheetPreview,
  IMPORT_FIELDS,
  pickImportFile,
  runSpreadsheetImport,
} from '../../src/lib/importData';
import { appStyles } from '../../src/ui/styles';

import type {
  ImportMapping,
  ImportPreview,
  SheetImportFile,
} from '../../src/lib/importData';

type Step = 1 | 2 | 3;

const STEPS: Array<{ step: Step; label: string }> = [
  { step: 1, label: 'Archivo' },
  { step: 2, label: 'Columnas' },
  { step: 3, label: 'Revisar' },
];

export default function ImportDataScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const clientsQuery = useAllClients();
  const importMutation = useImportPortableSnapshot();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [sheetFile, setSheetFile] = useState<SheetImportFile | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep(1);
    setSheetFile(null);
    setMapping(null);
    setPreview(null);
  };

  const handlePick = async () => {
    setLoadingFile(true);
    try {
      const picked = await pickImportFile();
      if (!picked) {
        return;
      }

      if (picked.kind === 'portable') {
        setSheetFile(null);
        setMapping(null);
        setPreview(buildPortablePreview(picked));
        setStep(3);
        return;
      }

      setSheetFile(picked);
      setMapping(picked.mapping);
      setPreview(null);
      setStep(2);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir el archivo',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    } finally {
      setLoadingFile(false);
    }
  };

  const handleReview = async () => {
    if (!sheetFile || !mapping) {
      return;
    }

    if (!mapping.clientName || !mapping.amount) {
      Alert.alert(
        'Faltan columnas',
        'Asigna al menos la columna del nombre del cliente y la del monto del prestamo.',
      );
      return;
    }

    const existing = clientsQuery.data ?? (await clientsQuery.refetch()).data ?? [];
    const nextPreview = buildSpreadsheetPreview({ ...sheetFile, mapping }, existing);

    if (nextPreview.loans.length === 0) {
      Alert.alert(
        'Sin prestamos para importar',
        'Ninguna fila tiene nombre y monto validos. Revisa el mapeo de columnas y los datos de la planilla.',
      );
      return;
    }

    setPreview(nextPreview);
    setStep(3);
  };

  const executeImport = async (current: ImportPreview) => {
    setBusy(true);
    try {
      if (current.source === 'mobiloan-portable') {
        const result = await importMutation.mutateAsync(current.payload);
        Alert.alert(
          'Respaldo importado',
          `${result.clients} clientes, ${result.loans} prestamos y ${result.payments} cuotas quedaron en el telefono.`,
        );
      } else {
        const result = await runSpreadsheetImport(current);
        await queryClient.invalidateQueries();

        const lines = [
          `${result.clients} cliente${result.clients === 1 ? '' : 's'} nuevo${
            result.clients === 1 ? '' : 's'
          }`,
          `${result.loans} prestamo${result.loans === 1 ? '' : 's'} creado${
            result.loans === 1 ? '' : 's'
          }`,
        ];

        if (result.skipped > 0) {
          lines.push(`${result.skipped} fila${result.skipped === 1 ? '' : 's'} omitida${
            result.skipped === 1 ? '' : 's'
          }`);
        }

        if (result.failed > 0) {
          lines.push(`${result.failed} prestamo${result.failed === 1 ? '' : 's'} con error`);
        }

        const detail =
          result.errors.length > 0 ? `\n\n${result.errors.slice(0, 3).join('\n')}` : '';

        Alert.alert('Importacion completada', `${lines.join('\n')}${detail}`);
      }

      router.back();
    } catch (error) {
      Alert.alert(
        'No se pudo importar',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) {
      return;
    }

    const message =
      preview.source === 'mobiloan-portable'
        ? `Se importaran ${preview.clients} clientes, ${preview.loans} prestamos y ${preview.paymentTransactions} pagos desde Mobiloan.`
        : `Se crearan ${preview.clients.filter((client) => client.isNew).length} clientes nuevos y ${
            preview.loans.length
          } prestamos.`;

    Alert.alert(
      'Confirmar importacion',
      `${message}\n\nLos datos se agregaran a la cartera de este telefono.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Importar', onPress: () => void executeImport(preview) },
      ],
    );
  };

  const setFieldMapping = (key: keyof ImportMapping, column: string) => {
    setMapping((current) => (current ? { ...current, [key]: column } : current));
  };

  const stepIndicator =
    preview?.source === 'mobiloan-portable' ? null : (
      <View style={styles.stepRow}>
        {STEPS.map((item) => {
          const done = step > item.step;
          const active = step === item.step;
          return (
            <View
              key={item.step}
              style={[styles.stepChip, (done || active) && styles.stepChipActive]}
            >
              <Text
                style={[styles.stepChipText, (done || active) && styles.stepChipTextActive]}
                numberOfLines={1}
              >
                {done ? '✓ ' : ''}
                {item.step}. {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );

  const fileStep = (
    <>
      <View style={appStyles.card}>
        <Pressable style={styles.uploadCard} onPress={handlePick} disabled={loadingFile}>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={30} color={APP_THEME.accent} />
          </View>
          <Text style={styles.uploadTitle}>
            {loadingFile ? 'Leyendo archivo...' : 'Selecciona un archivo'}
          </Text>
          <Text style={styles.uploadHint}>
            Excel (.xlsx, .xls), CSV o el JSON portable de Mobiloan.
          </Text>
        </Pressable>
      </View>

      <View style={appStyles.infoCard}>
        <Text style={appStyles.infoTitle}>Como funciona</Text>
        <Text style={appStyles.infoText}>1. Elige la planilla o el respaldo JSON.</Text>
        <Text style={appStyles.infoText}>
          2. Revisa el mapeo automatico de columnas y ajustalo si hace falta.
        </Text>
        <Text style={appStyles.infoText}>
          3. Confirma la vista previa. Los clientes nuevos se crean junto con sus prestamos.
        </Text>
      </View>
    </>
  );

  const renderMappingField = (field: (typeof IMPORT_FIELDS)[number]) => {
    const selected = mapping?.[field.key] ?? '';
    return (
      <View key={field.key} style={styles.fieldBlock}>
        <View style={appStyles.rowBetween}>
          <Text style={appStyles.label}>
            {field.label}
            {field.required ? ' *' : ''}
          </Text>
          <Text style={styles.hintText}>{field.hint}</Text>
        </View>
        <View style={appStyles.filterRow}>
          <Pressable
            style={[appStyles.filterChip, selected === '' && appStyles.filterChipActive]}
            onPress={() => setFieldMapping(field.key, '')}
          >
            <Text
              style={[
                appStyles.filterChipText,
                selected === '' && appStyles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              Ignorar
            </Text>
          </Pressable>
          {(sheetFile?.columns ?? []).map((column) => {
            const active = selected === column;
            return (
              <Pressable
                key={column}
                style={[appStyles.filterChip, active && appStyles.filterChipActive]}
                onPress={() => setFieldMapping(field.key, column)}
              >
                <Text
                  style={[
                    appStyles.filterChipText,
                    active && appStyles.filterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {column}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const mappingFields = <>{IMPORT_FIELDS.map(renderMappingField)}</>;

  const mappingPreviewRows = (sheetFile?.rows ?? []).slice(0, 5).map((row, index) => {
    const values = IMPORT_FIELDS.filter(
      (field) => mapping?.[field.key] && field.key !== 'interest' && field.key !== 'duration',
    ).map((field) => {
      const column = mapping?.[field.key] ?? '';
      const columnIndex = sheetFile?.columns.indexOf(column) ?? -1;
      const raw = columnIndex >= 0 ? row[columnIndex] : '';
      return { label: field.label, value: String(raw ?? '').trim() || '—' };
    });

    return (
      <View key={index} style={styles.previewRow}>
        <Text style={styles.previewTitle}>Fila {index + 1}</Text>
        {values.map((item) => (
          <Text key={item.label} style={styles.previewLine} numberOfLines={1}>
            <Text style={styles.previewKey}>{item.label}: </Text>
            {item.value}
          </Text>
        ))}
      </View>
    );
  });

  const mappingStep = (
    <>
      <View style={appStyles.card}>
        <View style={styles.fileLoadedRow}>
          <Ionicons name="document-text-outline" size={20} color={APP_THEME.accent} />
          <Text style={styles.fileLoadedText} numberOfLines={1}>
            {sheetFile?.fileName}
          </Text>
        </View>
        <Text style={appStyles.cardSubtitle}>
          {sheetFile?.rows.length ?? 0} filas detectadas. Relaciona cada dato de la app con una
          columna de la planilla.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Asigna las columnas</Text>
        <Text style={appStyles.cardSubtitle}>
          Toca el nombre de la columna que corresponde a cada campo.
        </Text>
        {isWide ? (
          <View style={appStyles.dashGrid}>
            <View style={appStyles.dashColumn}>
              {IMPORT_FIELDS.slice(0, 3).map(renderMappingField)}
            </View>
            <View style={appStyles.dashColumn}>
              {IMPORT_FIELDS.slice(3).map(renderMappingField)}
            </View>
          </View>
        ) : (
          mappingFields
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Vista previa</Text>
        <Text style={appStyles.cardSubtitle}>
          Primeras {Math.min(5, sheetFile?.rows.length ?? 0)} filas con el mapeo actual.
        </Text>
        {mappingPreviewRows}
      </View>

      <View style={styles.footerRow}>
        <Pressable style={[appStyles.buttonMuted, styles.footerButton]} onPress={reset}>
          <Text style={appStyles.buttonMutedText}>Cancelar</Text>
        </Pressable>
        <Pressable style={[appStyles.button, styles.footerButton]} onPress={handleReview}>
          <Text style={appStyles.buttonText}>Revisar importacion</Text>
        </Pressable>
      </View>
    </>
  );

  const spreadsheetKpis = preview?.source === 'spreadsheet' ? (
    <View style={styles.kpiRow}>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>
          {preview.clients.filter((client) => client.isNew).length}
        </Text>
        <Text style={styles.kpiLabel}>Nuevos clientes</Text>
      </View>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.loans.length}</Text>
        <Text style={styles.kpiLabel}>Prestamos</Text>
      </View>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.skippedCount}</Text>
        <Text style={styles.kpiLabel}>Filas omitidas</Text>
      </View>
    </View>
  ) : null;

  const portableKpis = preview?.source === 'mobiloan-portable' ? (
    <View style={styles.kpiRow}>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.clients}</Text>
        <Text style={styles.kpiLabel}>Clientes</Text>
      </View>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.loans}</Text>
        <Text style={styles.kpiLabel}>Prestamos</Text>
      </View>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.paymentTransactions}</Text>
        <Text style={styles.kpiLabel}>Pagos</Text>
      </View>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiValue}>{preview.pendingOutbox}</Text>
        <Text style={styles.kpiLabel}>Pendientes</Text>
      </View>
    </View>
  ) : null;

  const notices = (
    <>
      {preview?.source === 'spreadsheet' && preview.skippedCount > 0 ? (
        <View style={appStyles.alertCard}>
          <Text style={appStyles.alertTitle}>
            Se omitieron {preview.skippedCount} fila
            {preview.skippedCount === 1 ? '' : 's'}.
          </Text>
          <Text style={appStyles.alertText}>
            Cada fila necesita nombre y monto mayor que cero. Si el cliente no existe en la
            cartera, tambien necesita RUT.
          </Text>
        </View>
      ) : null}

      {preview?.source === 'mobiloan-portable' ? (
        <>
          <View style={appStyles.infoCard}>
            <Text style={appStyles.infoTitle}>Paquete de Mobiloan</Text>
            <Text style={appStyles.infoText}>
              Exportado: {preview.exportedAt ? formatDateTime(preview.exportedAt) : 'sin fecha'}
            </Text>
            <Text style={appStyles.infoText}>
              Incluye {preview.payments} cuotas y {preview.paymentTransactions} pagos registrados.
            </Text>
          </View>

          {preview.pendingOutbox > 0 ? (
            <View style={appStyles.alertCard}>
              <Text style={appStyles.alertTitle}>
                {preview.pendingOutbox} movimiento
                {preview.pendingOutbox === 1 ? '' : 's'} pendiente
                {preview.pendingOutbox === 1 ? '' : 's'}.
              </Text>
              <Text style={appStyles.alertText}>
                El paquete trae pagos sin sincronizar. Se importa la cartera y los pagos ya
                registrados; los pendientes se dejan fuera para evitar duplicados.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );

  const loanList =
    preview?.source === 'spreadsheet' ? (
      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Prestamos a importar</Text>
        <Text style={appStyles.cardSubtitle}>
          {preview.loans.length} prestamo{preview.loans.length === 1 ? '' : 's'} en total.
          {preview.loans.length > 10 ? ' Mostrando los primeros 10.' : ''}
        </Text>
        {preview.loans.slice(0, 10).map((loan, index) => (
          <View key={`${loan.clientTempId}-${index}`} style={styles.loanRow}>
            <View style={styles.loanInfo}>
              <Text style={styles.loanName} numberOfLines={1}>
                {loan.clientName}
              </Text>
              <Text style={styles.loanMeta} numberOfLines={1}>
                {formatDate(loan.startDate)} · {loan.durationMonths} mes
                {loan.durationMonths === 1 ? '' : 'es'} ·{' '}
                {(loan.interestRate * 100).toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.loanAmount} numberOfLines={1}>
              {formatCurrency(loan.amount)}
            </Text>
          </View>
        ))}
      </View>
    ) : null;

  const reviewStep = (
    <>
      {spreadsheetKpis}
      {portableKpis}

      {isWide ? (
        <View style={appStyles.dashGrid}>
          <View style={appStyles.dashColumn}>{notices}</View>
          <View style={appStyles.dashColumn}>{loanList}</View>
        </View>
      ) : (
        <>
          {notices}
          {loanList}
        </>
      )}

      <View style={styles.footerRow}>
        <Pressable
          style={[appStyles.buttonMuted, styles.footerButton]}
          onPress={() => setStep(preview?.source === 'mobiloan-portable' ? 1 : 2)}
          disabled={busy}
        >
          <Text style={appStyles.buttonMutedText}>
            {preview?.source === 'mobiloan-portable' ? 'Elegir otro archivo' : 'Atras'}
          </Text>
        </Pressable>
        <Pressable
          style={[appStyles.button, styles.footerButton, busy && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={busy}
        >
          <Text style={appStyles.buttonText}>
            {busy ? 'Importando...' : 'Confirmar e importar'}
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <ScrollView
      style={appStyles.screen}
      contentContainerStyle={appStyles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={appStyles.heroCard}>
          <Text style={appStyles.heroTitle}>Importar datos</Text>
          <Text style={appStyles.heroSubtitle}>
            Carga clientes y prestamos desde una planilla, o recupera un respaldo JSON de
            Mobiloan.
          </Text>
        </View>

        {stepIndicator}
        {step === 1 ? fileStep : null}
        {step === 2 ? mappingStep : null}
        {step === 3 ? reviewStep : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipActive: {
    backgroundColor: APP_THEME.accent,
  },
  stepChipText: {
    color: APP_THEME.slate,
    fontSize: 12,
    fontWeight: '800',
  },
  stepChipTextActive: {
    color: '#F8FDFF',
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    color: APP_THEME.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  uploadHint: {
    color: APP_THEME.slate,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  fileLoadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileLoadedText: {
    color: APP_THEME.ink,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  fieldBlock: {
    gap: 6,
  },
  hintText: {
    color: APP_THEME.slate,
    fontSize: 11.5,
    flexShrink: 1,
    textAlign: 'right',
  },
  previewRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTitle: {
    color: APP_THEME.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  previewLine: {
    color: APP_THEME.slate,
    fontSize: 12,
  },
  previewKey: {
    color: APP_THEME.ink,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiBox: {
    flexGrow: 1,
    flexBasis: 100,
    backgroundColor: APP_THEME.card,
    borderRadius: 18,
    padding: 14,
    gap: 3,
  },
  kpiValue: {
    color: APP_THEME.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  kpiLabel: {
    color: APP_THEME.slate,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loanRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  loanInfo: {
    flex: 1,
    gap: 2,
  },
  loanName: {
    color: APP_THEME.ink,
    fontSize: 13.5,
    fontWeight: '700',
  },
  loanMeta: {
    color: APP_THEME.slate,
    fontSize: 12,
  },
  loanAmount: {
    color: APP_THEME.ink,
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
