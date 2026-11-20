import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAllClients } from '../../src/hooks/useOfflineData';
import { useCreateLocalClient, useCreateLocalLoan } from '../../src/hooks/useSyncActions';
import { calculateAmortization } from '../../src/lib/amortization';
import { isValidDateInput, todayDateKey } from '../../src/lib/dates';
import { formatAmountInput, formatCurrency, formatDate, parseAmountInput } from '../../src/lib/format';
import { lateFeePolicyDescription, resolveLateFeePolicy } from '../../src/lib/lateFees';
import { formatRut, isValidRut } from '../../src/lib/rut';
import { appStyles } from '../../src/ui/styles';
import { DatePickerField } from '../../src/ui/DatePickerField';

const PREVIEW_LIMIT = 8;

const parseRate = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  return normalized === '' ? NaN : Number(normalized);
};

export default function NewLoanScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const params = useLocalSearchParams<{ clientId?: string }>();
  const initialClientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const clientsQuery = useAllClients();
  const createLoan = useCreateLocalLoan();
  const createClient = useCreateLocalClient();

  const [clientId, setClientId] = useState(initialClientId ?? '');
  const [clientSearch, setClientSearch] = useState('');
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickRut, setQuickRut] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickAddress, setQuickAddress] = useState('');

  const [amount, setAmount] = useState('500.000');
  const [interestRate, setInterestRate] = useState('0,10');
  const [durationMonths, setDurationMonths] = useState('6');
  const [startDate, setStartDate] = useState(todayDateKey());
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly'>('monthly');
  const [loanType, setLoanType] = useState<'Fixed' | 'Simple'>('Fixed');
  const [graceDays, setGraceDays] = useState('3');
  const [lateFeeType, setLateFeeType] = useState<'Fixed' | 'Percent'>('Fixed');
  const [lateFeeFixed, setLateFeeFixed] = useState('0');
  const [lateFeePercent, setLateFeePercent] = useState('0');

  const clients = clientsQuery.data ?? [];
  const selectedClient = clients.find((item) => item.id === clientId) ?? null;

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) {
      return clients;
    }

    return clients.filter((client) => {
      const haystack = [client.name, client.rut, client.phone].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [clientSearch, clients]);

  const principal = parseAmountInput(amount);
  const rate = parseRate(interestRate);
  const months = Number(durationMonths);
  const grace = Number(graceDays);

  const lateFeePolicy = useMemo(
    () =>
      resolveLateFeePolicy({
        graceDays: graceDays.trim() === '' ? undefined : grace,
        lateFeeType,
        lateFeeValue:
          lateFeeType === 'Percent'
            ? parseRate(lateFeePercent) / 100
            : parseAmountInput(lateFeeFixed),
      }),
    [grace, graceDays, lateFeeFixed, lateFeePercent, lateFeeType],
  );

  const preview = useMemo(() => {
    if (!isValidDateInput(startDate)) {
      return [];
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      return [];
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return [];
    }
    if (!Number.isFinite(months) || months < 1 || months > 600) {
      return [];
    }

    return calculateAmortization(principal, rate, Math.floor(months), startDate, frequency, loanType);
  }, [frequency, loanType, months, principal, rate, startDate]);

  const totals = useMemo(
    () =>
      preview.reduce(
        (acc, item) => ({
          amount: acc.amount + item.amount,
          interest: acc.interest + item.interest,
        }),
        { amount: 0, interest: 0 },
      ),
    [preview],
  );

  const resetQuickClient = () => {
    setQuickName('');
    setQuickRut('');
    setQuickPhone('');
    setQuickEmail('');
    setQuickAddress('');
    setShowQuickClient(false);
  };

  const handleQuickCreate = async () => {
    if (!quickName.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del cliente.');
      return;
    }

    if (!quickRut.trim() || !isValidRut(quickRut)) {
      Alert.alert('RUT invalido', 'Revisa el RUT del cliente, por ejemplo 12.345.678-9.');
      return;
    }

    if (!quickPhone.trim()) {
      Alert.alert('Falta el telefono', 'El telefono es necesario para cobrar y enviar recordatorios.');
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        name: quickName.trim(),
        rut: formatRut(quickRut),
        phone: quickPhone.trim(),
        email: quickEmail.trim(),
        address: quickAddress.trim(),
      });
      setClientId(client.id);
      setClientSearch('');
      resetQuickClient();
    } catch (error) {
      Alert.alert('No se pudo crear el cliente', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleCreate = async () => {
    if (!clientId) {
      Alert.alert('Falta cliente', 'Selecciona un cliente antes de crear el prestamo.');
      return;
    }

    if (!Number.isFinite(principal) || principal <= 0) {
      Alert.alert('Monto invalido', 'El monto del prestamo debe ser mayor que cero.');
      return;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      Alert.alert('Tasa invalida', 'La tasa de interes no puede ser negativa.');
      return;
    }

    if (rate > 1) {
      Alert.alert('Tasa invalida', 'Escribe la tasa como decimal: 0,10 equivale a 10%.');
      return;
    }

    if (!Number.isFinite(months) || months < 1) {
      Alert.alert('Plazo invalido', 'El plazo debe ser de al menos un mes.');
      return;
    }

    if (months > 600) {
      Alert.alert('Plazo invalido', 'El plazo no puede superar 50 anos (600 meses).');
      return;
    }

    if (!isValidDateInput(startDate)) {
      Alert.alert('Fecha invalida', 'Elige una fecha de inicio valida.');
      return;
    }

    if (!Number.isFinite(grace) || grace < 0) {
      Alert.alert('Dias de gracia invalidos', 'Escribe los dias de gracia antes de cobrar mora (0 o mas).');
      return;
    }

    if (lateFeeType === 'Percent' && lateFeePolicy.lateFeeValue > 1) {
      Alert.alert('Mora invalida', 'El porcentaje de mora no puede superar el 100% de la cuota.');
      return;
    }

    try {
      const result = await createLoan.mutateAsync({
        clientId,
        amount: principal,
        interestRate: rate,
        durationMonths: Math.floor(months),
        startDate,
        frequency,
        loanType,
        graceDays: lateFeePolicy.graceDays,
        lateFeeType,
        lateFeeValue: lateFeePolicy.lateFeeValue,
      });

      router.replace({ pathname: '/(app)/loans/[id]', params: { id: result.loan.id } });
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const quickClientForm = showQuickClient ? (
    <View style={appStyles.nestedCard}>
      <View style={appStyles.rowBetween}>
        <Text style={appStyles.cardTitle}>Cliente nuevo</Text>
        <Pressable onPress={resetQuickClient} accessibilityRole="button">
          <Text style={appStyles.linkText}>Cancelar</Text>
        </Pressable>
      </View>
      <Text style={appStyles.label}>Nombre</Text>
      <TextInput
        value={quickName}
        onChangeText={setQuickName}
        style={appStyles.input}
        placeholder="Nombre completo"
      />
      <Text style={appStyles.label}>RUT</Text>
      <TextInput
        value={quickRut}
        onChangeText={setQuickRut}
        onBlur={() => setQuickRut((current) => (current ? formatRut(current) : current))}
        style={appStyles.input}
        placeholder="12.345.678-9"
        autoCapitalize="characters"
      />
      <Text style={appStyles.label}>Telefono</Text>
      <TextInput
        value={quickPhone}
        onChangeText={setQuickPhone}
        style={appStyles.input}
        placeholder="+56 9 1234 5678"
        keyboardType="phone-pad"
      />
      <Text style={appStyles.label}>Email (opcional)</Text>
      <TextInput
        value={quickEmail}
        onChangeText={setQuickEmail}
        style={appStyles.input}
        placeholder="cliente@correo.cl"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={appStyles.label}>Direccion (opcional)</Text>
      <TextInput
        value={quickAddress}
        onChangeText={setQuickAddress}
        style={appStyles.input}
        placeholder="Calle, numero, comuna"
      />
      <Pressable
        style={[appStyles.button, createClient.isPending && { opacity: 0.7 }]}
        onPress={handleQuickCreate}
        disabled={createClient.isPending}
      >
        <Text style={appStyles.buttonText}>
          {createClient.isPending ? 'Guardando...' : 'Guardar y elegir'}
        </Text>
      </Pressable>
    </View>
  ) : null;

  const clientCard = (
    <View style={appStyles.card}>
      <Text style={appStyles.cardTitle}>Cliente</Text>

      {selectedClient ? (
        <View style={appStyles.selectedRow}>
          <View style={appStyles.flexOne}>
            <Text style={appStyles.itemTitle} numberOfLines={1}>
              {selectedClient.name}
            </Text>
            <Text style={appStyles.itemText} numberOfLines={1}>
              {[selectedClient.rut, selectedClient.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setClientId('');
              setClientSearch('');
            }}
          >
            <Text style={appStyles.linkText}>Cambiar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            value={clientSearch}
            onChangeText={setClientSearch}
            style={appStyles.input}
            placeholder="Buscar por nombre, RUT o telefono"
            autoCapitalize="none"
          />

          {filteredClients.slice(0, 6).map((client) => (
            <Pressable
              key={client.id}
              style={appStyles.selectRow}
              onPress={() => {
                setClientId(client.id);
                setClientSearch('');
              }}
            >
              <View style={appStyles.flexOne}>
                <Text style={appStyles.itemTitle} numberOfLines={1}>
                  {client.name}
                </Text>
                <Text style={appStyles.itemText} numberOfLines={1}>
                  {[client.rut, client.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                </Text>
              </View>
              <Text style={appStyles.selectHint}>Elegir</Text>
            </Pressable>
          ))}

          {filteredClients.length > 6 ? (
            <Text style={appStyles.itemText}>
              {filteredClients.length - 6} cliente{filteredClients.length - 6 === 1 ? '' : 's'} mas.
              Afina la busqueda para verlos.
            </Text>
          ) : null}

          {filteredClients.length === 0 ? (
            <Text style={appStyles.itemText}>
              {clients.length === 0
                ? 'Todavia no hay clientes en este telefono.'
                : 'Sin resultados para esa busqueda.'}
            </Text>
          ) : null}
        </>
      )}

      {!showQuickClient ? (
        <Pressable
          accessibilityRole="button"
          style={appStyles.buttonMuted}
          onPress={() => setShowQuickClient(true)}
        >
          <Text style={appStyles.buttonMutedText}>+ Crear cliente nuevo</Text>
        </Pressable>
      ) : null}

      {quickClientForm}
    </View>
  );

  const formCard = (
    <View style={appStyles.card}>
      <Text style={appStyles.label}>Monto del prestamo</Text>
      <TextInput
        value={amount}
        onChangeText={(text) => setAmount(formatAmountInput(text))}
        keyboardType="number-pad"
        style={appStyles.input}
        placeholder="500.000"
      />

      <View style={appStyles.fieldRow}>
        <View style={appStyles.fieldColumn}>
          <Text style={appStyles.label}>Tasa por periodo</Text>
          <TextInput
            value={interestRate}
            onChangeText={setInterestRate}
            keyboardType="decimal-pad"
            style={appStyles.input}
            placeholder="0,10 = 10%"
          />
        </View>
        <View style={appStyles.fieldColumn}>
          <Text style={appStyles.label}>Plazo en meses</Text>
          <TextInput
            value={durationMonths}
            onChangeText={(text) => setDurationMonths(text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            style={appStyles.input}
            placeholder="6"
          />
        </View>
      </View>

      <Text style={appStyles.label}>Fecha inicio</Text>
      <DatePickerField value={startDate} onChange={setStartDate} />

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

      <Text style={appStyles.label}>Mora por atraso</Text>
      <View style={appStyles.actionRow}>
        {(['Fixed', 'Percent'] as const).map((value) => (
          <Pressable
            key={value}
            style={lateFeeType === value ? appStyles.button : appStyles.buttonMuted}
            onPress={() => setLateFeeType(value)}
          >
            <Text style={lateFeeType === value ? appStyles.buttonText : appStyles.buttonMutedText}>
              {value === 'Fixed' ? 'Monto fijo' : 'Porcentaje'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={appStyles.fieldRow}>
        <View style={appStyles.fieldColumn}>
          <Text style={appStyles.label}>
            {lateFeeType === 'Percent' ? 'Porcentaje de la cuota' : 'Monto por cuota'}
          </Text>
          {lateFeeType === 'Percent' ? (
            <TextInput
              value={lateFeePercent}
              onChangeText={(text) => setLateFeePercent(text.replace(/[^\d,.]/g, ''))}
              keyboardType="decimal-pad"
              style={appStyles.input}
              placeholder="5 = 5%"
            />
          ) : (
            <TextInput
              value={lateFeeFixed}
              onChangeText={(text) => setLateFeeFixed(formatAmountInput(text))}
              keyboardType="number-pad"
              style={appStyles.input}
              placeholder="0"
            />
          )}
        </View>
        <View style={appStyles.fieldColumn}>
          <Text style={appStyles.label}>Dias de gracia</Text>
          <TextInput
            value={graceDays}
            onChangeText={(text) => setGraceDays(text.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            style={appStyles.input}
            placeholder="3"
          />
        </View>
      </View>
      <Text style={appStyles.itemText}>{lateFeePolicyDescription(lateFeePolicy)}</Text>

      <Pressable
        style={[appStyles.button, createLoan.isPending && { opacity: 0.7 }]}
        onPress={handleCreate}
        disabled={createLoan.isPending}
      >
        <Text
          style={appStyles.buttonText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {createLoan.isPending
            ? 'Creando...'
            : `Crear prestamo${selectedClient ? ` para ${selectedClient.name}` : ''}`}
        </Text>
      </Pressable>
    </View>
  );

  const previewCard = (
    <View style={appStyles.card}>
      <Text style={appStyles.cardTitle}>Vista previa</Text>

      {preview.length === 0 ? (
        <Text style={appStyles.itemText}>
          Revisa monto, tasa, plazo y fecha de inicio para ver el calendario.
        </Text>
      ) : (
        <>
          <View style={appStyles.previewStats}>
            <View style={appStyles.previewStat}>
              <Text style={appStyles.previewStatLabel}>Cuota</Text>
              <Text
                style={appStyles.previewStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(preview[0].amount)}
              </Text>
            </View>
            <View style={appStyles.previewStat}>
              <Text style={appStyles.previewStatLabel}>Total a pagar</Text>
              <Text
                style={appStyles.previewStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(totals.amount)}
              </Text>
            </View>
            <View style={appStyles.previewStat}>
              <Text style={appStyles.previewStatLabel}>Intereses</Text>
              <Text
                style={appStyles.previewStatValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatCurrency(totals.interest)}
              </Text>
            </View>
          </View>

          {preview.slice(0, PREVIEW_LIMIT).map((payment) => (
            <View key={payment.installment} style={appStyles.previewRow}>
              <Text style={appStyles.previewRowTitle}>Cuota {payment.installment}</Text>
              <Text style={appStyles.previewRowDate}>{formatDate(payment.dueDate)}</Text>
              <Text style={appStyles.previewRowAmount} numberOfLines={1}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>
          ))}

          {preview.length > PREVIEW_LIMIT ? (
            <Text style={appStyles.itemText}>
              y {preview.length - PREVIEW_LIMIT} cuota{preview.length - PREVIEW_LIMIT === 1 ? '' : 's'} mas
              hasta {formatDate(preview[preview.length - 1].dueDate)}.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Nuevo prestamo local</Text>
        <Text style={appStyles.heroSubtitle}>
          Elige o crea el cliente, define las condiciones y revisa el calendario antes de guardar.
        </Text>
      </View>

      {isWide ? (
        <View style={appStyles.dashGrid}>
          <View style={appStyles.dashColumn}>
            {clientCard}
            {formCard}
          </View>
          <View style={appStyles.dashColumn}>{previewCard}</View>
        </View>
      ) : (
        <View style={appStyles.dashColumn}>
          {clientCard}
          {formCard}
          {previewCard}
        </View>
      )}
    </ScrollView>
  );
}
