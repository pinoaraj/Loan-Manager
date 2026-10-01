import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useCreateLocalClient } from '../../src/hooks/useSyncActions';
import { appStyles } from '../../src/ui/styles';

export default function NewClientScreen() {
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const createClient = useCreateLocalClient();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Falta informacion', 'El nombre del cliente es obligatorio.');
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        name,
        rut,
        phone,
        email,
        address,
      });
      router.replace({ pathname: '/(app)/clients/[id]', params: { id: client.id } });
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Nuevo cliente local</Text>
        <Text style={appStyles.heroSubtitle}>
          Crea la ficha del cliente directamente desde Android, sin depender del desktop.
        </Text>
      </View>

      <View style={appStyles.card}>
        <Text style={appStyles.label}>Nombre</Text>
        <TextInput value={name} onChangeText={setName} style={appStyles.input} placeholder="Nombre completo" />
        <Text style={appStyles.label}>RUT</Text>
        <TextInput value={rut} onChangeText={setRut} style={appStyles.input} placeholder="12.345.678-9" />
        <Text style={appStyles.label}>Telefono</Text>
        <TextInput value={phone} onChangeText={setPhone} style={appStyles.input} placeholder="+569..." />
        <Text style={appStyles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={appStyles.input} placeholder="cliente@email.com" />
        <Text style={appStyles.label}>Direccion</Text>
        <TextInput value={address} onChangeText={setAddress} style={appStyles.input} placeholder="Direccion" />

        <Pressable style={appStyles.button} onPress={handleCreate}>
          <Text style={appStyles.buttonText}>
            {createClient.isPending ? 'Guardando...' : 'Crear cliente'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
