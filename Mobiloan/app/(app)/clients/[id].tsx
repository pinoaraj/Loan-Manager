import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useClientDetail } from '../../../src/hooks/useOfflineData';
import { useDeleteLocalClient, useUpdateLocalClient } from '../../../src/hooks/useSyncActions';
import { formatCurrency, formatDate } from '../../../src/lib/format';
import { openPhoneCall, openWhatsApp } from '../../../src/lib/contact';
import { appStyles } from '../../../src/ui/styles';

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const detailQuery = useClientDetail(clientId ?? '');
  const updateMutation = useUpdateLocalClient();
  const deleteMutation = useDeleteLocalClient();

  const client = detailQuery.data?.client;
  const loans = detailQuery.data?.loans ?? [];

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!client) {
      return;
    }

    setName(client.name ?? '');
    setRut(client.rut ?? '');
    setPhone(client.phone ?? '');
    setEmail(client.email ?? '');
    setAddress(client.address ?? '');
  }, [client]);

  const handleSave = async () => {
    if (!clientId) {
      return;
    }

    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'El nombre del cliente es obligatorio.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        clientId,
        draft: { name, rut, phone, email, address },
      });
      setIsEditing(false);
      Alert.alert('Cliente actualizado', 'Los datos quedaron guardados en este telefono.');
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleDelete = () => {
    if (!clientId) {
      return;
    }

    Alert.alert(
      'Eliminar cliente',
      'Se borraran el cliente, sus prestamos, cuotas y pagos de este telefono. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(clientId);
              router.replace('/');
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

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>{client?.name || 'Cliente'}</Text>
        <Text style={appStyles.heroSubtitle}>
          {client?.rut || 'Sin RUT'} - {client?.phone || 'Sin telefono'} - {client?.email || 'Sin email'}
        </Text>
      </View>

      <View style={appStyles.card}>
        <View style={appStyles.rowBetween}>
          <Text style={appStyles.cardTitle}>Ficha</Text>
          <Pressable onPress={() => setIsEditing((current) => !current)}>
            <Text style={appStyles.linkText}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
          </Pressable>
        </View>

        {isEditing ? (
          <>
            <Text style={appStyles.label}>Nombre</Text>
            <TextInput value={name} onChangeText={setName} style={appStyles.input} placeholder="Nombre completo" />

            <Text style={appStyles.label}>RUT</Text>
            <TextInput value={rut} onChangeText={setRut} style={appStyles.input} placeholder="12.345.678-9" />

            <Text style={appStyles.label}>Telefono</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={appStyles.input}
              keyboardType="phone-pad"
              placeholder="+56 9 1234 5678"
            />

            <Text style={appStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={appStyles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="cliente@correo.cl"
            />

            <Text style={appStyles.label}>Direccion</Text>
            <TextInput value={address} onChangeText={setAddress} style={appStyles.input} placeholder="Calle, numero, comuna" />

            <Pressable
              style={appStyles.button}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              <Text style={appStyles.buttonText}>
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={appStyles.itemText}>RUT: {client?.rut || 'Sin RUT'}</Text>
            <Text style={appStyles.itemText}>Telefono: {client?.phone || 'Sin telefono'}</Text>
            <Text style={appStyles.itemText}>Email: {client?.email || 'Sin email'}</Text>
            <Text style={appStyles.itemText}>Direccion: {client?.address || 'Sin direccion'}</Text>
            <Text style={appStyles.itemText}>Actualizado: {formatDate(client?.updatedAt)}</Text>
          </>
        )}

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
        <View style={appStyles.rowBetween}>
          <Text style={appStyles.cardTitle}>Prestamos</Text>
          {client ? (
            <Pressable
              style={appStyles.buttonMuted}
              onPress={() => router.push({ pathname: '/(app)/new-loan', params: { clientId: client.id } })}
            >
              <Text style={appStyles.buttonMutedText}>Nuevo prestamo</Text>
            </Pressable>
          ) : null}
        </View>
        {loans.map((loan) => (
          <Pressable
            key={loan.id}
            style={appStyles.listItem}
            onPress={() => router.push({ pathname: '/(app)/loans/[id]', params: { id: loan.id } })}
          >
            <Text style={appStyles.itemTitle}>{formatCurrency(loan.amount)}</Text>
            <Text style={appStyles.itemText}>
              {loan.loanType} - {loan.frequency} - {loan.status}
              {loan.isPaused ? ' - Pausado' : ''}
            </Text>
            <Text style={appStyles.itemText}>
              Inicio: {formatDate(loan.startDate)} - Duracion: {loan.durationMonths} meses
            </Text>
          </Pressable>
        ))}

        {loans.length === 0 && (
          <Text style={appStyles.emptyState}>Este cliente aun no tiene prestamos registrados.</Text>
        )}
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.cardTitle}>Zona de riesgo</Text>
        <Text style={appStyles.cardSubtitle}>
          Eliminar un cliente borra tambien sus prestamos, cuotas y pagos de este telefono.
        </Text>
        <Pressable
          style={appStyles.buttonDanger}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Text style={appStyles.buttonDangerText}>
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar cliente'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
