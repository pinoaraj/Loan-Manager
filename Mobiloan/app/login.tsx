import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { formatDateTime } from '../src/lib/format';
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
            : 'Para el primer ingreso necesitas conexion al backend.'
          : null;
      Alert.alert('No se pudo iniciar sesion', offlineHint ? `${error.message}\n\n${offlineHint}` : error.message);
    },
  });

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[appStyles.screen, { justifyContent: 'center', padding: 20 }]}
    >
      <View style={appStyles.heroCard}>
        <Text style={appStyles.heroTitle}>Mobiloan</Text>
        <Text style={appStyles.heroSubtitle}>
          Cobranza offline-first con sincronizacion segura sobre la cartera del desktop.
        </Text>
      </View>

      <View style={[appStyles.card, appStyles.statusCard, isOnline === false ? appStyles.statusWarning : appStyles.statusInfo]}>
        <Text style={appStyles.statusTitle}>
          {isOnline === false ? 'Modo sin conexion' : 'Estado de acceso'}
        </Text>
        <Text style={appStyles.statusText}>
          {isOnline === false
            ? hasOfflineData
              ? 'Si ya tenias una sesion activa restaurada, la cartera local puede seguir operando sin internet.'
              : 'Todavia no hay una cartera local utilizable. El primer ingreso requiere conexion.'
            : 'Despues del primer ingreso, la app puede seguir cobrando con la cartera local aunque la red falle.'}
        </Text>
        <Text style={appStyles.statusText}>
          Ultima sincronizacion local: {formatDateTime(lastSyncAt)}
        </Text>
      </View>

      <View style={[appStyles.card, { marginTop: 16 }]}>
        <Text style={appStyles.cardTitle}>Ingresar</Text>
        <Text style={appStyles.cardSubtitle}>
          El token se guarda de forma segura para trabajar aunque la conectividad sea intermitente.
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
          <Pressable style={appStyles.button} onPress={handleSubmit((values) => loginMutation.mutate(values))}>
            <Text style={appStyles.buttonText}>
              {loginMutation.isPending ? 'Conectando...' : 'Entrar y sincronizar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
