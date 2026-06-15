import { useLocalSearchParams } from 'expo-router';
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
import { useLoanDetail } from '../../../src/hooks/useOfflineData';
import { useManualSync, useQueuePayment } from '../../../src/hooks/useSyncActions';
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
  const { session, isOnline, lastSyncAt, needsReauth, authMessage, refreshAppState } = useSession();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  const loan = detailQuery.data?.loan;
  const payments = detailQuery.data?.payments ?? [];
  const transactions = detailQuery.data?.transactions ?? [];
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? null;
  const selectedPaymentRemaining = selectedPayment
    ? Math.max(selectedPayment.amount + selectedPayment.lateFee - selectedPayment.paidAmount, 0)
    : null;
  const canQueueSelectedPayment = Boolean(selectedPayment && selectedPaymentRemaining && selectedPaymentRemaining > 0);

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

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>{loan ? formatCurrency(loan.amount) : 'Prestamo'}</Text>
        <Text style={appStyles.heroSubtitle}>
          {detailQuery.data?.client?.name || 'Cliente'} - {loan?.loanType || 'N/A'} - {loan?.frequency || 'N/A'}
        </Text>
      </View>

      <View style={[appStyles.card, appStyles.statusCard, isOnline === false ? appStyles.statusWarning : appStyles.statusInfo]}>
        <Text style={appStyles.statusTitle}>
          {needsReauth ? 'Sesion remota vencida' : isOnline === false ? 'Cobranza offline habilitada' : 'Sync disponible'}
        </Text>
        <Text style={appStyles.statusText}>
          {needsReauth
            ? 'Puedes seguir guardando pagos en outbox, pero la app no podra confirmarlos contra el backend hasta reingresar con conexion.'
            : isOnline === false
            ? 'Puedes registrar pagos en outbox. No se perderan y quedaran pendientes hasta recuperar red.'
            : 'Si la conexion responde, la app intentara sincronizar este pago apenas lo guardes.'}
        </Text>
        {authMessage ? (
          <Text style={appStyles.statusText}>Detalle backend: {authMessage}</Text>
        ) : null}
        <Text style={appStyles.statusText}>
          Ultima sincronizacion: {formatDateTime(lastSyncAt)}
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Contacto</Text>
        <Text style={appStyles.cardSubtitle}>
          Atajos para comunicarte con el cliente desde el telefono del cobrador.
        </Text>
        <View style={appStyles.actionRow}>
          <Pressable
            style={appStyles.buttonMuted}
            onPress={async () => {
              try {
                await openPhoneCall(detailQuery.data?.client?.phone);
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
                await openWhatsApp(detailQuery.data?.client?.phone);
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
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Registrar pago offline</Text>
        <Text style={appStyles.cardSubtitle}>
          Selecciona una cuota, guarda la transaccion localmente y sincroniza cuando haya red.
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
                ? isOnline === false
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
                  clientName: detailQuery.data?.client?.name || 'Cliente',
                  clientPhone: detailQuery.data?.client?.phone,
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
