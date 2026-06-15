import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useAllClients } from '../../src/hooks/useOfflineData';
import { useCreateLocalLoan } from '../../src/hooks/useSyncActions';
import { calculateAmortization } from '../../src/lib/amortization';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { appStyles } from '../../src/ui/styles';

export default function NewLoanScreen() {
  const params = useLocalSearchParams<{ clientId?: string }>();
  const initialClientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const clientsQuery = useAllClients();
  const createLoan = useCreateLocalLoan();

  const [clientId, setClientId] = useState(initialClientId ?? '');
  const [amount, setAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('0.10');
  const [durationMonths, setDurationMonths] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly'>('monthly');
  const [loanType, setLoanType] = useState<'Fixed' | 'Simple'>('Fixed');

  const clients = clientsQuery.data ?? [];
  const selectedClient = clients.find((item) => item.id === clientId) ?? null;

  const preview = useMemo(() => {
    const principal = Number(amount);
    const rate = Number(interestRate);
    const months = Number(durationMonths);
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(rate) || !Number.isFinite(months) || months <= 0) {
      return [];
    }

    return calculateAmortization(principal, rate, months, startDate, frequency, loanType);
  }, [amount, durationMonths, frequency, interestRate, loanType, startDate]);

  const handleCreate = async () => {
    if (!clientId) {
      Alert.alert('Falta cliente', 'Selecciona un cliente antes de crear el prestamo.');
      return;
    }

    try {
      const result = await createLoan.mutateAsync({
        clientId,
        amount: Number(amount),
        interestRate: Number(interestRate),
        durationMonths: Number(durationMonths),
        startDate,
        frequency,
        loanType,
      });

      router.replace({ pathname: '/(app)/loans/[id]', params: { id: result.loan.id } });
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Nuevo prestamo local</Text>
        <Text style={appStyles.heroSubtitle}>
          Genera el prestamo y su calendario de cuotas directamente desde Android.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Cliente</Text>
        {clients.map((client) => (
          <Pressable
            key={client.id}
            style={clientId === client.id ? appStyles.button : appStyles.buttonMuted}
            onPress={() => setClientId(client.id)}
          >
            <Text style={clientId === client.id ? appStyles.buttonText : appStyles.buttonMutedText}>
              {client.name}
            </Text>
          </Pressable>
        ))}
        {clients.length === 0 && (
          <Text style={appStyles.itemText}>Primero debes crear al menos un cliente local.</Text>
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.label}>Monto</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Tasa por periodo</Text>
        <TextInput value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Plazo en meses</Text>
        <TextInput value={durationMonths} onChangeText={setDurationMonths} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Fecha inicio</Text>
        <TextInput value={startDate} onChangeText={setStartDate} style={appStyles.input} />

        <Text style={appStyles.label}>Frecuencia</Text>
        <View style={appStyles.actionRow}>
          {(['monthly', 'bi-weekly', 'weekly'] as const).map((value) => (
            <Pressable
              key={value}
              style={frequency === value ? appStyles.button : appStyles.buttonMuted}
              onPress={() => setFrequency(value)}
            >
              <Text style={frequency === value ? appStyles.buttonText : appStyles.buttonMutedText}>
                {value === 'monthly' ? 'Mensual' : value === 'bi-weekly' ? 'Quincenal' : 'Semanal'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={appStyles.label}>Tipo</Text>
        <View style={appStyles.actionRow}>
          {(['Fixed', 'Simple'] as const).map((value) => (
            <Pressable
              key={value}
              style={loanType === value ? appStyles.button : appStyles.buttonMuted}
              onPress={() => setLoanType(value)}
            >
              <Text style={loanType === value ? appStyles.buttonText : appStyles.buttonMutedText}>
                {value === 'Fixed' ? 'Cuota fija' : 'Interes simple'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={appStyles.button} onPress={handleCreate}>
          <Text style={appStyles.buttonText}>
            {createLoan.isPending ? 'Creando...' : `Crear prestamo${selectedClient ? ` para ${selectedClient.name}` : ''}`}
          </Text>
        </Pressable>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Vista previa</Text>
        <Text style={appStyles.cardSubtitle}>
          Primera cuota: {formatCurrency(preview[0]?.amount ?? 0)} - Total cuotas: {preview.length}
        </Text>
        {preview.slice(0, 6).map((payment) => (
          <View key={payment.installment} style={appStyles.listItem}>
            <Text style={appStyles.itemTitle}>
              Cuota {payment.installment} - {formatCurrency(payment.amount)}
            </Text>
            <Text style={appStyles.itemText}>Fecha: {formatDate(payment.dueDate.toISOString())}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
