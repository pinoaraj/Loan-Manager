import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { calculateAmortization } from '../../src/lib/amortization';
import { APP_THEME } from '../../src/lib/config';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { SegmentedControl } from '../../src/ui/components';
import { appStyles } from '../../src/ui/styles';

type Frequency = 'monthly' | 'bi-weekly' | 'weekly';
type LoanType = 'Fixed' | 'Simple';

const FREQUENCIES: Array<{ value: Frequency; label: string }> = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'bi-weekly', label: 'Quincenal' },
  { value: 'weekly', label: 'Semanal' },
];

const LOAN_TYPES: Array<{ value: LoanType; label: string }> = [
  { value: 'Fixed', label: 'Cuota fija' },
  { value: 'Simple', label: 'Interes simple' },
];

export default function CalculatorScreen() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 560;
  const isWide = width >= 720;

  const [amount, setAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('0.10');
  const [durationMonths, setDurationMonths] = useState('6');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [loanType, setLoanType] = useState<LoanType>('Fixed');

  const principal = Number(amount);
  const rate = Number(interestRate);
  const months = Number(durationMonths);

  const error = useMemo(() => {
    if (!amount || !Number.isFinite(principal)) return 'Ingresa el monto del prestamo.';
    if (principal <= 0) return 'El monto debe ser mayor a 0.';
    if (!interestRate || !Number.isFinite(rate)) return 'Ingresa la tasa de interes.';
    if (rate < 0) return 'La tasa no puede ser negativa.';
    if (rate > 1) return 'La tasa parece muy alta (maximo 100%).';
    if (!durationMonths || !Number.isFinite(months)) return 'Ingresa el plazo en meses.';
    if (months <= 0) return 'El plazo debe ser mayor a 0 meses.';
    if (months > 600) return 'El plazo no puede superar 50 anos.';
    if (!startDate) return 'Ingresa la fecha de inicio.';
    return '';
  }, [amount, durationMonths, interestRate, months, principal, rate, startDate]);

  const schedule = useMemo(() => {
    if (error) return [];
    return calculateAmortization(principal, rate, months, startDate, frequency, loanType);
  }, [error, frequency, loanType, months, principal, rate, startDate]);

  const totals = useMemo(() => {
    const totalAmount = schedule.reduce((sum, item) => sum + item.amount, 0);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
    return { totalAmount, totalInterest };
  }, [schedule]);

  const estimatedPayment = schedule[0]?.amount ?? 0;

  /**
   * Saldo corrido igual que la tabla del detalle: lo que falta pagar
   * despues de cada cuota.
   */
  const scheduleRows = useMemo(() => {
    const total = schedule.reduce((sum, item) => sum + item.amount, 0);
    let accumulated = 0;

    return schedule.map((item) => {
      accumulated += item.amount;
      return { ...item, balance: Math.max(total - accumulated, 0) };
    });
  }, [schedule]);

  const summaryCards = (
    <View style={isNarrow ? { gap: 12 } : appStyles.summaryRow}>
      <View style={appStyles.summaryCardDark}>
        <Text style={appStyles.summaryCardDarkLabel}>Cuota estimada</Text>
        <Text
          style={appStyles.summaryCardDarkValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatCurrency(estimatedPayment)}
        </Text>
        <View style={{ height: 1, backgroundColor: '#1E3A5F' }} />
        <View style={appStyles.summaryCardDarkRow}>
          <Text style={appStyles.summaryCardDarkKey}>Total a pagar</Text>
          <Text style={appStyles.summaryCardDarkVal} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totals.totalAmount)}
          </Text>
        </View>
        <View style={appStyles.summaryCardDarkRow}>
          <Text style={appStyles.summaryCardDarkKey}>Costo del interes</Text>
          <Text style={[appStyles.summaryCardDarkVal, { color: '#7DD3FC' }]} numberOfLines={1}>
            {formatCurrency(totals.totalInterest)}
          </Text>
        </View>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Informacion del plan</Text>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>N de cuotas</Text>
          <View style={appStyles.calcBadge}>
            <Text style={appStyles.calcBadgeText}>{schedule.length}</Text>
          </View>
        </View>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>Tasa aplicada</Text>
          <Text style={appStyles.dataValue}>
            {Number.isFinite(rate) ? `${(rate * 100).toFixed(1)}%` : '-'}
          </Text>
        </View>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>Tipo</Text>
          <Text style={appStyles.dataValue} numberOfLines={1} adjustsFontSizeToFit>
            {loanType === 'Fixed' ? 'Frances (cuota fija)' : 'Interes simple'}
          </Text>
        </View>
        <View style={appStyles.dataRow}>
          <Text style={appStyles.dataLabel}>Frecuencia</Text>
          <Text style={appStyles.dataValue}>
            {FREQUENCIES.find((item) => item.value === frequency)?.label}
          </Text>
        </View>
      </View>
    </View>
  );

  const amortizationHead = (
    <View style={appStyles.calcHeadRow}>
      <Text style={[appStyles.calcHeadText, appStyles.calcColN]}>N</Text>
      <Text style={[appStyles.calcHeadText, appStyles.calcColDate]}>Fecha</Text>
      <Text style={[appStyles.calcHeadText, appStyles.calcColAmount]}>Cuota</Text>
      <Text style={[appStyles.calcHeadText, appStyles.calcColAmount]}>Capital</Text>
      <Text style={[appStyles.calcHeadText, appStyles.calcColAmount]}>Interes</Text>
      <Text style={[appStyles.calcHeadText, appStyles.calcColAmount]}>Saldo</Text>
    </View>
  );

  const amortizationRows = scheduleRows.map((payment) => (
    <View key={payment.installment} style={appStyles.calcRow}>
      <Text style={[appStyles.calcCellMuted, appStyles.calcColN]}>{payment.installment}</Text>
      <Text style={[appStyles.calcCellText, appStyles.calcColDate]}>
        {formatDate(payment.dueDate.toISOString())}
      </Text>
      <Text style={[appStyles.calcCellStrong, appStyles.calcColAmount]}>
        {formatCurrency(payment.amount)}
      </Text>
      <Text style={[appStyles.calcCellMuted, appStyles.calcColAmount]}>
        {formatCurrency(payment.principal)}
      </Text>
      <Text style={[appStyles.calcCellAccent, appStyles.calcColAmount]}>
        {formatCurrency(payment.interest)}
      </Text>
      <Text style={[appStyles.calcCellMuted, appStyles.calcColAmount]}>
        {formatCurrency(payment.balance)}
      </Text>
    </View>
  ));

  const amortizationMobileRows = scheduleRows.map((payment) => (
    <View key={payment.installment} style={appStyles.calcMobileRow}>
      <View style={appStyles.calcMobileTop}>
        <Text style={appStyles.calcMobileTitle} numberOfLines={1}>
          {payment.installment} · {formatDate(payment.dueDate.toISOString())}
        </Text>
        <Text style={appStyles.calcMobileAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {formatCurrency(payment.amount)}
        </Text>
      </View>
      <Text style={appStyles.calcMobileMeta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        Cap {formatCurrency(payment.principal)} · Int {formatCurrency(payment.interest)} · Saldo{' '}
        {formatCurrency(payment.balance)}
      </Text>
    </View>
  ));

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <View style={appStyles.inlineRow}>
          <Ionicons name="calculator-outline" size={24} color="#7DD3FC" />
          <Text style={appStyles.heroTitle}>Simulador de prestamos</Text>
        </View>
        <Text style={appStyles.heroSubtitle}>
          Calcula cuotas y amortizacion sin registrar datos.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Parametros</Text>

        <Text style={appStyles.label}>Monto del prestamo</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={appStyles.input}
          placeholder="500000"
        />

        <Text style={appStyles.label}>Tasa de interes (por periodo)</Text>
        <TextInput
          value={interestRate}
          onChangeText={setInterestRate}
          keyboardType="decimal-pad"
          style={appStyles.input}
          placeholder="0.10"
        />
        <Text style={appStyles.statSubtext}>Ej: 0.10 para 10% mensual.</Text>

        <View style={isNarrow ? { gap: 10 } : appStyles.summaryRow}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={appStyles.label}>Plazo (meses)</Text>
            <TextInput
              value={durationMonths}
              onChangeText={setDurationMonths}
              keyboardType="number-pad"
              style={appStyles.input}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={appStyles.label}>Fecha inicio</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              style={appStyles.input}
              placeholder="2026-06-15"
            />
          </View>
        </View>

        <Text style={appStyles.label}>Frecuencia</Text>
        <SegmentedControl options={FREQUENCIES} value={frequency} onChange={setFrequency} />

        <Text style={appStyles.label}>Amortizacion</Text>
        <SegmentedControl options={LOAN_TYPES} value={loanType} onChange={setLoanType} />
      </View>

      {error ? (
        <View style={appStyles.alertCard}>
          <View style={appStyles.inlineRowTop}>
            <Ionicons name="alert-circle" size={20} color="#B91C1C" />
            <View style={appStyles.flexOne}>
              <Text style={appStyles.alertTitle}>Revisa los datos</Text>
              <Text style={appStyles.alertText}>{error}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {summaryCards}

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <Text style={appStyles.cardTitle}>Tabla de amortizacion</Text>
          <Text style={appStyles.rowMeta}>{schedule.length} cuotas</Text>
        </View>

        {schedule.length === 0 ? (
          <Text style={appStyles.emptyState}>
            Corrige los parametros para ver el plan de pagos.
          </Text>
        ) : (
          <View style={appStyles.calcTableWrap}>
            {isWide ? (
              <View style={appStyles.calcTableWide}>
                {amortizationHead}
                {amortizationRows}
              </View>
            ) : (
              <View style={{ gap: 8, paddingVertical: 8 }}>
                {amortizationMobileRows}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
