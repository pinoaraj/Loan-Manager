import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { openPhoneCall, openWhatsApp } from '../../../src/lib/contact';
import { createCollectionReminder } from '../../../src/lib/calendar';
import { formatCurrency, formatDate, formatDateTime } from '../../../src/lib/format';
import { getLoanHealth } from '../../../src/lib/loanHealth';
import {
  shareContractPdf,
  shareInstallmentsCsv,
  sharePromissoryNotePdf,
} from '../../../src/lib/reports';
import { useLoanDetail } from '../../../src/hooks/useOfflineData';
import {
  useDeleteLocalLoan,
  useManualSync,
  useQueuePayment,
  useRecalculateLoan,
  useSetLoanPaused,
} from '../../../src/hooks/useSyncActions';
import { useSession } from '../../../src/providers/AppProviders';
import { syncService } from '../../../src/services/sync';
import { appStyles } from '../../../src/ui/styles';

export default function LoanDetailScreen() {
  const params = useLocalSearchParams<{ id: string; paymentId?: string }>();
  const loanId = Array.isArray(params.id) ? params.id[0] : params.id;
  const preselectedPaymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;
  const detailQuery = useLoanDetail(loanId ?? '');
  const queuePayment = useQueuePayment();
  const syncMutation = useManualSync();
  const pauseMutation = useSetLoanPaused();
  const recalculateMutation = useRecalculateLoan();
  const deleteLoanMutation = useDeleteLocalLoan();
  const { session, isOnline, lastSyncAt, needsReauth, authMessage, refreshAppState } = useSession();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);

  const loan = detailQuery.data?.loan;
  const client = detailQuery.data?.client ?? null;
  const payments = detailQuery.data?.payments ?? [];
  const transactions = detailQuery.data?.transactions ?? [];
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? null;
  const selectedPaymentRemaining = selectedPayment
    ? Math.max(selectedPayment.amount + selectedPayment.lateFee - selectedPayment.paidAmount, 0)
    : null;
  const canQueueSelectedPayment = Boolean(
    selectedPayment && selectedPaymentRemaining && selectedPaymentRemaining > 0,
  );

  const health = useMemo(
    () => (loan ? getLoanHealth(loan, payments) : null),
    [loan, payments],
  );

  const groupedTransactions = useMemo(() => {
    return transactions.reduce<Record<string, typeof transactions>>((acc, transaction) => {
      acc[transaction.paymentId] ??= [];
      acc[transaction.paymentId].push(transaction);
      return acc;
    }, {});
  }, [transactions]);

  useEffect(() => {
    if (preselectedPaymentId && payments.some((payment) => payment.id === preselectedPaymentId)) {
      setSelectedPaymentId(preselectedPaymentId);
      return;
    }

    if (!selectedPaymentId && payments.length > 0) {
      const firstPendingPayment = payments.find((payment) => payment.status !== 'Paid');
      setSelectedPaymentId(firstPendingPayment?.id ?? payments[0].id);
    }
  }, [payments, preselectedPaymentId, selectedPaymentId]);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const totalScheduled = payments.reduce((sum, payment) => sum + payment.amount + payment.lateFee, 0);

  const handleQueuePayment = async () => {
    if (!selectedPaymentId) {
      Alert.alert('Selecciona una cuota', 'Primero elige la cuota que quieres registrar.');
      return;
    }

    if (!canQueueSelectedPayment) {
      Alert.alert('Cuota cerrada', 'Selecciona una cuota con saldo pendiente antes de registrar el pago.');
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto invalido', 'Ingresa un monto positivo.');
      return;
    }

    if (selectedPaymentRemaining !== null && parsedAmount > selectedPaymentRemaining + 0.01) {
      Alert.alert(
        'Monto excedido',
        `El saldo pendiente de esta cuota es ${formatCurrency(selectedPaymentRemaining)}.`,
      );
      return;
    }

    try {
      await queuePayment.mutateAsync({
        paymentId: selectedPaymentId,
        amount: parsedAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        method,
        notes,
      });

      setAmount('');
      setNotes('');
      await refreshAppState();

      if (session?.mode === 'local') {
        Alert.alert(
          'Pago guardado',
          'La transaccion quedo guardada en la base local del telefono. Puedes exportar un respaldo desde Ajustes cuando quieras.',
        );
        return;
      }

      if (session && (await syncService.isOnline())) {
        try {
          await syncMutation.mutateAsync();
          await refreshAppState();
          Alert.alert('Pago registrado', 'La transaccion se guardo localmente y tambien se sincronizo con el backend.');
        } catch (syncError) {
          Alert.alert(
            'Guardado offline',
            `La transaccion quedo en la outbox local. La sincronizacion inmediata quedo pendiente: ${
              syncError instanceof Error ? syncError.message : 'Error desconocido'
            }`,
          );
        }
      } else {
        Alert.alert('Guardado offline', 'La transaccion quedo en la outbox local y se enviara en la siguiente sincronizacion.');
      }
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleTogglePause = async () => {
    if (!loan) {
      return;
    }

    try {
      await pauseMutation.mutateAsync({ loanId: loan.id, paused: !loan.isPaused });
      Alert.alert(
        loan.isPaused ? 'Prestamo reanudado' : 'Prestamo pausado',
        loan.isPaused
          ? 'El prestamo vuelve a contar para la cobranza.'
          : 'El prestamo deja de contar como deuda activa hasta que lo reanudes.',
      );
    } catch (error) {
      Alert.alert('No se pudo actualizar', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleRecalculate = () => {
    if (!loan) {
      return;
    }

    if (transactions.length > 0) {
      Alert.alert(
        'Recalculo bloqueado',
        'Este prestamo ya tiene pagos registrados. Para recalcular hay que eliminar los pagos primero.',
      );
      return;
    }

    Alert.alert(
      'Recalcular cuotas',
      'Se borraran las cuotas actuales y se generara un calendario nuevo con los mismos datos del prestamo. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recalcular',
          style: 'destructive',
          onPress: async () => {
            try {
              await recalculateMutation.mutateAsync(loan.id);
              Alert.alert('Prestamo recalculado', 'El calendario de cuotas fue regenerado.');
            } catch (error) {
              Alert.alert(
                'No se pudo recalcular',
                error instanceof Error ? error.message : 'Error desconocido',
              );
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    if (!loan) {
      return;
    }

    Alert.alert(
      'Eliminar prestamo',
      'Se borraran el prestamo, sus cuotas y sus pagos de este telefono. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLoanMutation.mutateAsync(loan.id);
              router.replace('/(app)');
            } catch (error) {
              Alert.alert(
                'No se pudo eliminar',
                error instanceof Error ? error.message : 'Error desconocido',
              );
            }
          },
        },
      ],
    );
  };

  const handleDocument = async (kind: 'contract' | 'promissory' | 'csv') => {
    if (!loan) {
      return;
    }

    setDocumentBusy(kind);
    try {
      const input = { loan, client, payments };
      if (kind === 'contract') {
        await shareContractPdf(input);
      } else if (kind === 'promissory') {
        await sharePromissoryNotePdf(input);
      } else {
        await shareInstallmentsCsv(input);
      }
    } catch (error) {
      Alert.alert(
        'No se pudo generar el documento',
        error instanceof Error ? error.message : 'Error desconocido',
      );
    } finally {
      setDocumentBusy(null);
    }
  };

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <View style={appStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={appStyles.heroTitle}>
              {loan ? formatCurrency(loan.amount) : 'Prestamo'}
            </Text>
            <Text style={appStyles.heroSubtitle}>
              {client?.name || 'Cliente'} - {loan?.loanType || 'N/A'} - {loan?.frequency || 'N/A'}
            </Text>
          </View>
          {health ? (
            <View style={[appStyles.chip, { backgroundColor: health.backgroundColor }]}>
              <Text style={[appStyles.chipText, { color: health.color }]}>{health.label}</Text>
            </View>
          ) : null}
        </View>
        {health ? <Text style={appStyles.heroSubtitle}>{health.description}</Text> : null}
      </View>

      {session?.mode === 'remote' ? (
        <View
          style={[
            appStyles.card,
            appStyles.statusCard,
            isOnline === false ? appStyles.statusWarning : appStyles.statusInfo,
          ]}
        >
          <Text style={appStyles.statusTitle}>
            {needsReauth ? 'Sesion remota vencida' : isOnline === false ? 'Sin conexion' : 'Sync disponible'}
          </Text>
          <Text style={appStyles.statusText}>
            {needsReauth
              ? 'Puedes seguir guardando pagos, pero no se confirmaran contra el escritorio hasta reingresar con conexion.'
              : isOnline === false
                ? 'Los pagos se guardan en el telefono y quedan pendientes hasta recuperar red.'
                : 'Si la conexion responde, la app intentara sincronizar este pago apenas lo guardes.'}
          </Text>
          {authMessage ? (
            <Text style={appStyles.statusText}>Detalle backend: {authMessage}</Text>
          ) : null}
          <Text style={appStyles.statusText}>Ultima sincronizacion: {formatDateTime(lastSyncAt)}</Text>
        </View>
      ) : null}

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Contacto</Text>
        <View style={appStyles.actionRow}>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={async () => {
              try {
                await openPhoneCall(client?.phone);
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
                await openWhatsApp(client?.phone);
              } catch (error) {
                Alert.alert('No se pudo abrir WhatsApp', error instanceof Error ? error.message : 'Error desconocido');
              }
            }}
          >
            <Text style={appStyles.buttonMutedText}>WhatsApp</Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.statGrid}>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Pagado</Text>
          <Text style={appStyles.statValue}>{formatCurrency(totalPaid)}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Programado</Text>
          <Text style={appStyles.statValue}>{formatCurrency(totalScheduled)}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Saldo</Text>
          <Text style={appStyles.statValue}>{formatCurrency(Math.max(totalScheduled - totalPaid, 0))}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Cuotas</Text>
          <Text style={appStyles.statValue}>
            {payments.filter((payment) => payment.status === 'Paid').length}/{payments.length}
          </Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Documentos</Text>
        <Text style={appStyles.cardSubtitle}>
          Genera el contrato, el pagare o el detalle de cuotas para compartirlo.
        </Text>
        <View style={appStyles.actionRow}>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => handleDocument('contract')}
            disabled={documentBusy !== null}
          >
            <Text style={appStyles.buttonMutedText}>
              {documentBusy === 'contract' ? 'Generando...' : 'Contrato PDF'}
            </Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => handleDocument('promissory')}
            disabled={documentBusy !== null}
          >
            <Text style={appStyles.buttonMutedText}>
              {documentBusy === 'promissory' ? 'Generando...' : 'Pagare PDF'}
            </Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={() => handleDocument('csv')}
            disabled={documentBusy !== null}
          >
            <Text style={appStyles.buttonMutedText}>
              {documentBusy === 'csv' ? 'Generando...' : 'Cuotas CSV'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Administrar prestamo</Text>
        <Text style={appStyles.cardSubtitle}>
          Pausa la deuda, regenera el calendario o elimina el prestamo del telefono.
        </Text>
        <View style={appStyles.actionRow}>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={handleTogglePause}
            disabled={pauseMutation.isPending}
          >
            <Text style={appStyles.buttonMutedText}>
              {pauseMutation.isPending
                ? 'Guardando...'
                : loan?.isPaused
                  ? 'Reanudar prestamo'
                  : 'Pausar prestamo'}
            </Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={handleRecalculate}
            disabled={recalculateMutation.isPending}
          >
            <Text style={appStyles.buttonMutedText}>
              {recalculateMutation.isPending ? 'Recalculando...' : 'Recalcular cuotas'}
            </Text>
          </Pressable>
          <Pressable
            style={appStyles.buttonDanger}
            onPress={handleDelete}
            disabled={deleteLoanMutation.isPending}
          >
            <Text style={appStyles.buttonDangerText}>
              {deleteLoanMutation.isPending ? 'Eliminando...' : 'Eliminar prestamo'}
            </Text>
          </Pressable>
        </View>
        {transactions.length > 0 ? (
          <Text style={appStyles.itemText}>
            El recalculo esta bloqueado porque este prestamo ya tiene pagos registrados.
          </Text>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Registrar pago</Text>
        <Text style={appStyles.cardSubtitle}>
          Selecciona una cuota, guarda la transaccion y sincroniza cuando haya red.
        </Text>
        <Text style={appStyles.itemText}>
          {selectedPayment
            ? `Cuota seleccionada: ${formatDate(selectedPayment.dueDate)} - Saldo pendiente: ${formatCurrency(selectedPaymentRemaining ?? 0)}`
            : 'Aun no has seleccionado una cuota.'}
        </Text>

        <Text style={appStyles.label}>Monto</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="25000"
          style={appStyles.input}
        />

        <Text style={appStyles.label}>Metodo</Text>
        <TextInput value={method} onChangeText={setMethod} style={appStyles.input} placeholder="Cash" />

        <Text style={appStyles.label}>Notas</Text>
        <TextInput value={notes} onChangeText={setNotes} style={appStyles.input} placeholder="Cobrado en terreno" />

        <Pressable
          style={[appStyles.button, !canQueueSelectedPayment ? { opacity: 0.55 } : null]}
          onPress={handleQueuePayment}
        >
          <Text style={appStyles.buttonText}>
            {queuePayment.isPending
              ? 'Guardando...'
              : canQueueSelectedPayment
                ? session?.mode === 'local'
                  ? 'Guardar pago'
                  : isOnline === false
                    ? 'Guardar sin conexion'
                    : 'Guardar y sincronizar'
                : 'Selecciona una cuota pendiente'}
          </Text>
        </Pressable>

        {selectedPayment ? (
          <Pressable
            style={appStyles.buttonMuted}
            onPress={async () => {
              try {
                await createCollectionReminder({
                  clientName: client?.name || 'Cliente',
                  clientPhone: client?.phone,
                  paymentId: selectedPayment.id,
                  loanId: loanId ?? 'loan',
                  amount: selectedPaymentRemaining ?? selectedPayment.amount,
                  dueDate: selectedPayment.dueDate,
                  installmentLabel: `cuota ${formatDate(selectedPayment.dueDate)}`,
                });
                Alert.alert('Recordatorio creado', 'La cobranza quedo guardada en el calendario del telefono.');
              } catch (error) {
                Alert.alert('No se pudo crear el recordatorio', error instanceof Error ? error.message : 'Error desconocido');
              }
            }}
          >
            <Text style={appStyles.buttonMutedText}>Agregar al calendario</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Cuotas</Text>
        {payments.map((payment) => {
          const isSelected = selectedPaymentId === payment.id;
          const remaining = payment.amount + payment.lateFee - payment.paidAmount;

          return (
            <Pressable
              key={payment.id}
              style={[
                appStyles.listItem,
                isSelected ? { borderWidth: 2, borderColor: '#0E7490' } : null,
              ]}
              onPress={() => setSelectedPaymentId(payment.id)}
            >
              <Text style={appStyles.itemTitle}>
                {formatDate(payment.dueDate)} - {formatCurrency(payment.amount + payment.lateFee)}
              </Text>
              <Text style={appStyles.itemText}>
                Estado: {payment.status} - Restante: {formatCurrency(Math.max(remaining, 0))}
              </Text>

              {(groupedTransactions[payment.id] ?? []).map((transaction) => (
                <View key={transaction.id} style={{ marginTop: 8 }}>
                  <Text style={appStyles.itemText}>
                    {formatDate(transaction.date)} - {transaction.method} - {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
