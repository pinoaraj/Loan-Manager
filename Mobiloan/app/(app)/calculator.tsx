import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { calculateAmortization } from '../../src/lib/amortization';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { appStyles } from '../../src/ui/styles';

export default function CalculatorScreen() {
  const [amount, setAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('0.10');
  const [durationMonths, setDurationMonths] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly'>('monthly');
  const [loanType, setLoanType] = useState<'Fixed' | 'Simple'>('Fixed');

  const schedule = useMemo(() => {
    const principal = Number(amount);
    const rate = Number(interestRate);
    const months = Number(durationMonths);
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(rate) || !Number.isFinite(months) || months <= 0) {
      return [];
    }

    return calculateAmortization(principal, rate, months, startDate, frequency, loanType);
  }, [amount, durationMonths, frequency, interestRate, loanType, startDate]);

  const totals = useMemo(() => {
    const totalAmount = schedule.reduce((sum, item) => sum + item.amount, 0);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    return { totalAmount, totalInterest };
  }, [schedule]);

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Calculadora offline</Text>
        <Text style={appStyles.heroSubtitle}>
          Simula el prestamo completo desde el telefono antes de crear la operacion real.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Parametros</Text>
        <Text style={appStyles.label}>Monto</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Tasa por periodo</Text>
        <TextInput value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Plazo en meses</Text>
        <TextInput value={durationMonths} onChangeText={setDurationMonths} keyboardType="numeric" style={appStyles.input} />
        <Text style={appStyles.label}>Fecha inicio</Text>
        <TextInput value={startDate} onChangeText={setStartDate} style={appStyles.input} placeholder="2026-06-15" />

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
      </View>

      <View style={appStyles.statGrid}>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Cuota estimada</Text>
          <Text style={appStyles.statValue}>{formatCurrency(schedule[0]?.amount ?? 0)}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Total interes</Text>
          <Text style={appStyles.statValue}>{formatCurrency(totals.totalInterest)}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Total plan</Text>
          <Text style={appStyles.statValue}>{formatCurrency(totals.totalAmount)}</Text>
        </View>
        <View style={appStyles.statBox}>
          <Text style={appStyles.statLabel}>Cuotas</Text>
          <Text style={appStyles.statValue}>{schedule.length}</Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Amortizacion</Text>
        {schedule.map((payment) => (
          <View key={payment.installment} style={appStyles.listItem}>
            <Text style={appStyles.itemTitle}>
              Cuota {payment.installment} - {formatCurrency(payment.amount)}
            </Text>
            <Text style={appStyles.itemText}>Fecha: {formatDate(payment.dueDate.toISOString())}</Text>
            <Text style={appStyles.itemText}>Capital: {formatCurrency(payment.principal)}</Text>
            <Text style={appStyles.itemText}>Interes: {formatCurrency(payment.interest)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
