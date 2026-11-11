import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateTime } from '../src/lib/format';
import { APP_VERSION } from '../src/lib/config';
import { mobileApi } from '../src/services/api';
import { syncService } from '../src/services/sync';
import { useSession } from '../src/providers/AppProviders';
import { appStyles } from '../src/ui/styles';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginScreen() {
  const { session, setSession, hasOfflineData, isOnline, lastSyncAt } = useSession();
  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginForm) => {
      const nextSession = await mobileApi.login(values.username.trim(), values.password);
      await setSession(nextSession);
      try {
        await syncService.syncAll(nextSession);
        return { session: nextSession, syncWarning: null as string | null };
      } catch (error) {
        return {
          session: nextSession,
          syncWarning:
            error instanceof Error
              ? error.message
              : 'No se pudo sincronizar de inmediato. La cartera local seguira disponible.',
        };
      }
    },
    onSuccess: ({ syncWarning }) => {
      if (syncWarning) {
        Alert.alert(
          'Sesion iniciada',
          `Entraste correctamente, pero la sincronizacion inicial quedo pendiente: ${syncWarning}`,
        );
      }
      router.replace('/(app)');
    },
    onError: (error: Error) => {
      const offlineHint =
        isOnline === false
          ? hasOfflineData
            ? 'Tu cartera local sigue disponible si ya tenias una sesion restaurada.'
            : 'El modo independiente no necesita este paso: toca "Entrar sin PC ni internet".'
          : null;
      Alert.alert('No se pudo iniciar sesion', offlineHint ? `${error.message}\n\n${offlineHint}` : error.message);
    },
  });

  if (session) {
    return <Redirect href="/(app)" />;
  }

  const handleLocalAccess = async () => {
    await setSession({
      token: 'local-only',
      username: 'Operador local',
      mode: 'local',
    });
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={appStyles.screen}
      >
        <ScrollView contentContainerStyle={[appStyles.scroll, { flexGrow: 1, justifyContent: 'center' }]}>
        <View style={appStyles.heroCard}>
          <Text style={appStyles.heroTitle}>Mobiloan</Text>
          <Text style={appStyles.heroSubtitle}>
            Cartera de cobranza que funciona sola en el telefono. Sin PC, sin internet y sin backend.
          </Text>
        </View>

        <View style={appStyles.card}>
          <Text style={appStyles.cardTitle}>Usar en este telefono</Text>
          <Text style={appStyles.cardSubtitle}>
            Modo independiente: clientes, prestamos, calculadora, calendario y respaldo JSON.
            Todo queda guardado en el telefono.
          </Text>
          <Pressable style={appStyles.button} onPress={handleLocalAccess}>
            <Text style={appStyles.buttonText}>Entrar sin PC ni internet</Text>
          </Pressable>
        </View>

        <View style={appStyles.card}>
          <Text style={appStyles.cardTitle}>Sincronizar con el PC (opcional)</Text>
          <Text style={appStyles.cardSubtitle}>
            Solo si quieres compartir la misma cartera con Loan Manager desktop.
            Requiere el PC encendido y la misma red Wi-Fi.
          </Text>

          <Text style={appStyles.label}>Usuario</Text>
          <Controller
            control={control}
            name="username"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                style={appStyles.input}
                value={value}
                onChangeText={onChange}
                placeholder="admin"
              />
            )}
          />

          <Text style={appStyles.label}>Contrasena</Text>
          <Controller
            control={control}
            name="password"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                secureTextEntry
                style={appStyles.input}
                value={value}
                onChangeText={onChange}
                placeholder="********"
              />
            )}
          />

          <View style={{ marginTop: 6 }}>
            <Pressable
              style={appStyles.buttonMuted}
              onPress={handleSubmit((values) => loginMutation.mutate(values))}
            >
              <Text style={appStyles.buttonMutedText}>
                {loginMutation.isPending ? 'Conectando...' : 'Entrar y sincronizar'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            appStyles.card,
            appStyles.statusCard,
            isOnline === false ? appStyles.statusWarning : appStyles.statusInfo,
          ]}
        >
          <Text style={appStyles.statusTitle}>
            {isOnline === false ? 'Sin conexion: el modo local sigue disponible' : 'Modo local listo'}
          </Text>
          <Text style={appStyles.statusText}>
            El modo independiente no usa la red. Solo la sincronizacion con el PC necesita Wi-Fi.
          </Text>
          {lastSyncAt ? (
            <Text style={appStyles.statusText}>
              Ultima sincronizacion con el PC: {formatDateTime(lastSyncAt)}
            </Text>
          ) : null}
        </View>

        <Text style={[appStyles.statusText, { textAlign: 'center' }]}>
          Mobiloan beta {APP_VERSION}
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
