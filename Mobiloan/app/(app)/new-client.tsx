import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { useCreateLocalClient } from '../../src/hooks/useSyncActions';
import { formatRut, isValidRut } from '../../src/lib/rut';
import { appStyles } from '../../src/ui/styles';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewClientScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
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

    if (!rut.trim() || !isValidRut(rut)) {
      Alert.alert('RUT invalido', 'Escribe un RUT valido, por ejemplo 12.345.678-9.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Falta el telefono', 'El telefono es necesario para cobrar y enviar recordatorios.');
      return;
    }

    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) {
      Alert.alert('Email invalido', 'Revisa el correo, por ejemplo cliente@correo.cl.');
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        name: name.trim(),
        rut: formatRut(rut),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      });
      router.replace({ pathname: '/(app)/clients/[id]', params: { id: client.id } });
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const identityFields = (
    <>
      <Text style={appStyles.label}>Nombre</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={appStyles.input}
        placeholder="Nombre completo"
        autoCapitalize="words"
      />
      <Text style={appStyles.label}>RUT</Text>
      <TextInput
        value={rut}
        onChangeText={setRut}
        onBlur={() => setRut((current) => (current ? formatRut(current) : current))}
        style={appStyles.input}
        placeholder="12.345.678-9"
        autoCapitalize="characters"
      />
      <Text style={appStyles.label}>Telefono</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        style={appStyles.input}
        placeholder="+56 9 1234 5678"
        keyboardType="phone-pad"
      />
    </>
  );

  const contactFields = (
    <>
      <Text style={appStyles.label}>Email (opcional)</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={appStyles.input}
        placeholder="cliente@correo.cl"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={appStyles.label}>Direccion (opcional)</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        style={appStyles.input}
        placeholder="Calle, numero, comuna"
      />
    </>
  );

  const createButton = (
    <Pressable
      style={[appStyles.button, createClient.isPending && { opacity: 0.7 }]}
      onPress={handleCreate}
      disabled={createClient.isPending}
    >
      <Text style={appStyles.buttonText}>
        {createClient.isPending ? 'Guardando...' : 'Crear cliente'}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={appStyles.scroll}>
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Nuevo cliente local</Text>
        <Text style={appStyles.heroSubtitle}>
          Crea la ficha del cliente directamente desde Android, sin depender del desktop.
        </Text>
      </View>

      <View style={appStyles.card}>
        {isWide ? (
          <View style={{ gap: 14 }}>
            <View style={appStyles.dashGrid}>
              <View style={appStyles.dashColumn}>{identityFields}</View>
              <View style={appStyles.dashColumn}>{contactFields}</View>
            </View>
            {createButton}
          </View>
        ) : (
          <>
            {identityFields}
            {contactFields}
            {createButton}
          </>
        )}
      </View>
    </ScrollView>
  );
}
