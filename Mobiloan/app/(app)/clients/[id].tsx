import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { openPhoneCall, openWhatsApp } from '../../../src/lib/contact';
import { formatCurrency, formatDate } from '../../../src/lib/format';
import { useClientDetail } from '../../../src/hooks/useOfflineData';
import { appStyles } from '../../../src/ui/styles';

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const detailQuery = useClientDetail(clientId ?? '');

  const client = detailQuery.data?.client;
  const loans = detailQuery.data?.loans ?? [];

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>{client?.name || 'Cliente'}</Text>
        <Text style={appStyles.heroSubtitle}>
          {client?.rut || 'Sin RUT'} • {client?.phone || 'Sin telefono'} • {client?.email || 'Sin email'}
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Ficha local</Text>
        <Text style={appStyles.itemText}>Direccion: {client?.address || 'Sin direccion'}</Text>
        <Text style={appStyles.itemText}>Actualizado: {formatDate(client?.updatedAt)}</Text>
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

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Prestamos</Text>
        {loans.map((loan) => (
          <Pressable
            key={loan.id}
            style={appStyles.listItem}
            onPress={() => router.push({ pathname: '/(app)/loans/[id]', params: { id: loan.id } })}
          >
            <Text style={appStyles.itemTitle}>{formatCurrency(loan.amount)}</Text>
            <Text style={appStyles.itemText}>
              {loan.loanType} • {loan.frequency} • {loan.status}
            </Text>
            <Text style={appStyles.itemText}>
              Inicio: {formatDate(loan.startDate)} • Duracion: {loan.durationMonths} meses
            </Text>
          </Pressable>
        ))}

        {loans.length === 0 && <Text style={appStyles.itemText}>Este cliente aun no tiene prestamos descargados.</Text>}
      </View>
    </ScrollView>
  );
}
