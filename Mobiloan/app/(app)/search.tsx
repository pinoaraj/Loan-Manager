import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useAllClients, useLoans } from '../../src/hooks/useOfflineData';
import { APP_THEME } from '../../src/lib/config';
import { formatCurrency } from '../../src/lib/format';
import { frequencyLabel, loanStatusLabel } from '../../src/lib/labels';
import { appStyles } from '../../src/ui/styles';

/** Busca sin distinguir mayusculas ni tildes (`Munoz` encuentra `Muñoz`). */
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const digitsOnly = (value: string) => value.replace(/\D/g, '');

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const clientsQuery = useAllClients();
  const loansQuery = useLoans();

  const clients = clientsQuery.data ?? [];
  const loans = loansQuery.data ?? [];

  const term = normalize(query.trim());
  const digits = digitsOnly(query);

  const clientResults = useMemo(() => {
    if (!term) {
      return [];
    }

    return clients
      .filter((client) => {
        const haystack = normalize(
          [client.name, client.rut, client.phone, client.email, client.address]
            .filter(Boolean)
            .join(' '),
        );

        if (haystack.includes(term)) {
          return true;
        }

        return digits.length >= 3 && digitsOnly(client.rut ?? '').includes(digits);
      })
      .slice(0, 8);
  }, [clients, digits, term]);

  const loanResults = useMemo(() => {
    if (!term) {
      return [];
    }

    return loans
      .filter((loan) => {
        const haystack = normalize(
          [
            loan.clientName,
            loanStatusLabel(loan.status),
            frequencyLabel(loan.frequency),
            loan.overdueCount > 0 ? 'vencido moroso atrasado' : '',
          ]
            .filter(Boolean)
            .join(' '),
        );

        if (haystack.includes(term)) {
          return true;
        }

        if (digits.length >= 3) {
          return (
            digitsOnly(String(Math.round(loan.amount))).includes(digits) ||
            digitsOnly(String(Math.round(loan.totalRemaining))).includes(digits)
          );
        }

        return false;
      })
      .slice(0, 12);
  }, [digits, loans, term]);

  const hasQuery = term.length > 0;
  const hasResults = clientResults.length > 0 || loanResults.length > 0;

  const openClient = (id: string) =>
    router.push({ pathname: '/(app)/clients/[id]', params: { id } });

  const openLoan = (id: string) =>
    router.push({ pathname: '/(app)/loans/[id]', params: { id } });

  const quickActions = (
    <View style={appStyles.card}>
      <Text style={appStyles.cardTitle}>Accesos rapidos</Text>
      <View style={appStyles.actionRow}>
        <Pressable style={appStyles.button} onPress={() => router.push('/new-loan')}>
          <Text style={appStyles.buttonText}>Prestamo</Text>
        </Pressable>
        <Pressable style={appStyles.buttonMuted} onPress={() => router.push('/new-client')}>
          <Text style={appStyles.buttonMutedText}>Cliente</Text>
        </Pressable>
        <Pressable style={appStyles.buttonMuted} onPress={() => router.push('/collections')}>
          <Text style={appStyles.buttonMutedText}>Cobranza</Text>
        </Pressable>
        <Pressable style={appStyles.buttonMuted} onPress={() => router.push('/portfolio')}>
          <Text style={appStyles.buttonMutedText}>Cartera</Text>
        </Pressable>
      </View>
    </View>
  );

  const recentClients = !hasQuery ? (
    <View style={appStyles.card}>
      <Text style={appStyles.cardTitle}>Clientes</Text>
      {clients.length === 0 ? (
        <Text style={appStyles.itemText}>Todavia no hay clientes en este telefono.</Text>
      ) : (
        clients.slice(0, 6).map((client) => (
          <Pressable
            key={client.id}
            accessibilityRole="button"
            style={appStyles.selectRow}
            onPress={() => openClient(client.id)}
          >
            <View style={appStyles.flexOne}>
              <Text style={appStyles.itemTitle} numberOfLines={1}>
                {client.name}
              </Text>
              <Text style={appStyles.itemText} numberOfLines={1}>
                {[client.rut, client.phone].filter(Boolean).join(' A� ') || 'Sin datos de contacto'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={APP_THEME.slate} />
          </Pressable>
        ))
      )}
    </View>
  ) : null;

  return (
    <ScrollView
      style={appStyles.screen}
      contentContainerStyle={appStyles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={appStyles.card}>
        <View style={appStyles.inlineRow}>
          <Ionicons name="search" size={20} color={APP_THEME.slate} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={[appStyles.input, appStyles.flexOne]}
            placeholder="Cliente, RUT, telefono o monto"
            placeholderTextColor="#94A3B8"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar busqueda"
              onPress={() => setQuery('')}
            >
              <Ionicons name="close-circle" size={22} color={APP_THEME.slate} />
            </Pressable>
          ) : null}
        </View>
        <Text style={appStyles.itemText}>
          Busca por nombre, RUT, telefono o monto. Por ejemplo `Maria`, `12.345` o `150000`.
        </Text>
      </View>

      {!hasQuery ? (
        <View style={appStyles.dashStack}>
          {quickActions}
          {recentClients}
        </View>
      ) : !hasResults ? (
        <View style={appStyles.emptyCard}>
          <Text style={appStyles.emptyTitle}>Sin resultados</Text>
          <Text style={appStyles.emptyMessage}>
            No encontramos clientes ni prestamos para `{query.trim()}`. Prueba con otro nombre, RUT
            o monto.
          </Text>
        </View>
      ) : (
        <View style={appStyles.dashStack}>
          {clientResults.length > 0 ? (
            <View style={appStyles.dashStack}>
              <Text style={appStyles.sectionTitle}>Clientes</Text>
              {clientResults.map((client) => (
                <Pressable
                  key={client.id}
                  accessibilityRole="button"
                  style={appStyles.selectRow}
                  onPress={() => openClient(client.id)}
                >
                  <View style={appStyles.flexOne}>
                    <Text style={appStyles.itemTitle} numberOfLines={1}>
                      {client.name}
                    </Text>
                    <Text style={appStyles.itemText} numberOfLines={1}>
                      {[client.rut, client.phone].filter(Boolean).join(' A� ') ||
                        'Sin datos de contacto'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={APP_THEME.slate} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {loanResults.length > 0 ? (
            <View style={appStyles.dashStack}>
              <Text style={appStyles.sectionTitle}>Prestamos</Text>
              {loanResults.map((loan) => (
                <Pressable
                  key={loan.id}
                  accessibilityRole="button"
                  style={appStyles.listItem}
                  onPress={() => openLoan(loan.id)}
                >
                  <View style={appStyles.rowBetween}>
                    <Text style={appStyles.itemTitle} numberOfLines={1}>
                      {loan.clientName}
                    </Text>
                    <View style={appStyles.inlineRow}>
                      {loan.overdueCount > 0 ? (
                        <Text style={[appStyles.itemText, { color: '#B91C1C', fontWeight: '800' }]}>
                          {loan.overdueCount} vencida{loan.overdueCount === 1 ? '' : 's'}
                        </Text>
                      ) : null}
                      <Text style={appStyles.itemText}>{loanStatusLabel(loan.status)}</Text>
                    </View>
                  </View>
                  <Text style={appStyles.itemText} numberOfLines={1}>
                    {formatCurrency(loan.amount)} A� {loan.durationMonths} cuotas A�{' '}
                    {frequencyLabel(loan.frequency)}
                  </Text>
                  <Text style={appStyles.itemText} numberOfLines={1}>
                    Saldo {formatCurrency(loan.totalRemaining)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}
